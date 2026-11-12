import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { IMAGE_EXTENSIONS } from '../../common/constants';
import { sha256 } from '../../common/hash';
import { detectImageType } from '../../common/image-type';
import {
  FILE_STORAGE,
  type FileStorage,
  type TypedFile,
} from '../../common/storage/file-storage';
import type { UploadedFileData } from '../../common/validators/image-file.validator';
import type { UpdateBankAccountDto } from '../dto/update-bank-account.dto';
import { VendorPaymentDetails } from '../entities/vendor-payment-details.entity';
import { PaymentDetailsRepository } from '../payment-details.repository';

@Injectable()
export class PaymentDetailsService {
  private readonly logger = new Logger(PaymentDetailsService.name);

  constructor(
    private readonly details: PaymentDetailsRepository,
    @Inject(FILE_STORAGE) private readonly storage: FileStorage,
  ) {}

  /**
   * Gets where Mero Event pays a vendor.
   *
   * @remarks
   * - A vendor that never added any comes back with every field null and `hasQr: false`, not a 404.
   *
   * @param {string} vendorId - Vendor id (the session's own vendor on portal routes)
   * @returns {Promise<VendorPaymentDetails>} Bank fields, `hasQr` and `updatedAt`
   *
   * @example
   * ```ts
   * const { accountNumber, hasQr } = await paymentDetailsService.find(vendor.id);
   * ```
   */
  async find(vendorId: string): Promise<VendorPaymentDetails> {
    const details = await this.details.findByVendor(vendorId);

    return (
      details ??
      Object.assign(new VendorPaymentDetails(), {
        vendorId,
        bankName: null,
        accountName: null,
        accountNumber: null,
        branch: null,
        qrStorageKey: null,
        qrMimeType: null,
        updatedAt: null,
      })
    );
  }

  /**
   * Sets or replaces the vendor's bank account. Idempotent.
   *
   * @remarks
   * - One upsert on `vendor_id`; the QR, if any, is untouched.
   * - Logged (without the number): a changed payout account is what an account takeover would do.
   *
   * @param {string} vendorId - The logged-in vendor
   * @param {UpdateBankAccountDto} dto - Bank name, account name, account number, optional branch
   * @returns {Promise<VendorPaymentDetails>} The updated details
   *
   * @example
   * ```ts
   * await paymentDetailsService.updateBank(vendor.id, { bankName: 'Nabil Bank', accountName: 'Everest Sound Pvt Ltd', accountNumber: '01234567890123' });
   * ```
   */
  async updateBank(
    vendorId: string,
    { branch, ...bank }: UpdateBankAccountDto,
  ): Promise<VendorPaymentDetails> {
    await this.details.upsertBank(vendorId, {
      ...bank,
      branch: branch || null,
    });

    this.logger.log({
      method: 'updateBank',
      message: 'Vendor bank account set',
      vendorId,
    });

    return this.find(vendorId);
  }

  /**
   * Removes the vendor's bank account. Idempotent; the QR, if any, stays.
   *
   * @param {string} vendorId - The logged-in vendor
   * @returns {Promise<VendorPaymentDetails>} The updated details
   *
   * @example
   * ```ts
   * await paymentDetailsService.clearBank(vendor.id);
   * ```
   */
  async clearBank(vendorId: string): Promise<VendorPaymentDetails> {
    await this.details.clearBank(vendorId);

    this.logger.log({
      method: 'clearBank',
      message: 'Vendor bank account removed',
      vendorId,
    });

    return this.find(vendorId);
  }

  /**
   * Stores a payment QR image and makes it the vendor's QR, replacing (and deleting) the old one.
   *
   * @remarks
   * - The type comes from the file's bytes (JPEG, PNG or WebP), never the client's mimetype.
   * - Idempotent per image: uploading the current QR again writes nothing.
   * - The file is written before the row points to it; if the database write fails, the new file is removed again.
   *
   * @param {string} vendorId - The logged-in vendor
   * @param {UploadedFileData} file - Validated upload (memory storage)
   * @returns {Promise<VendorPaymentDetails>} The updated details, `hasQr: true`
   * @throws {BadRequestException} Throws a `BadRequestException` with HTTP status code 400 (Bad request) if the file isn't a supported image
   *
   * @example
   * ```ts
   * await paymentDetailsService.replaceQr(vendor.id, file);
   * ```
   */
  async replaceQr(
    vendorId: string,
    file: UploadedFileData,
  ): Promise<VendorPaymentDetails> {
    const mimeType = detectImageType(file.buffer);
    const extension = mimeType && IMAGE_EXTENSIONS[mimeType];

    /* ImageFileValidator already rejects these; kept so this method is safe on its own */
    if (!mimeType || !extension)
      throw new BadRequestException(
        `${file.originalname} is not a JPEG, PNG or WebP image`,
      );

    const key = `vendors/${vendorId}/payment-qr/${sha256(file.buffer)}.${extension}`;

    if ((await this.details.findQrKey(vendorId)) === key)
      return this.find(vendorId);

    await this.storage.save(key, file.buffer);
    const previous = await this.details
      .replaceQr(vendorId, key, mimeType)
      .catch(async (error: unknown) => {
        await this.storage.remove(key);
        throw error;
      });

    if (previous && previous !== key) await this.storage.remove(previous);

    this.logger.log({
      method: 'replaceQr',
      message: 'Vendor payment QR set',
      vendorId,
      replaced: Boolean(previous),
    });

    return this.find(vendorId);
  }

  /**
   * Removes the vendor's payment QR and its file. Idempotent; the bank account, if any, stays.
   *
   * @param {string} vendorId - The logged-in vendor
   * @returns {Promise<VendorPaymentDetails>} The updated details, `hasQr: false`
   *
   * @example
   * ```ts
   * await paymentDetailsService.removeQr(vendor.id);
   * ```
   */
  async removeQr(vendorId: string): Promise<VendorPaymentDetails> {
    const previous = await this.details.removeQr(vendorId);

    if (previous) {
      await this.storage.remove(previous);
      this.logger.log({
        method: 'removeQr',
        message: 'Vendor payment QR removed',
        vendorId,
      });
    }

    return this.find(vendorId);
  }

  /**
   * Opens the vendor's payment QR image.
   *
   * @param {string} vendorId - Vendor id (the session's own vendor on portal routes)
   * @returns {Promise<TypedFile>} A read stream with its size and type
   * @throws {NotFoundException} Throws a `NotFoundException` with HTTP status code 404 (Not found) if the vendor has no QR or its file is missing
   *
   * @example
   * ```ts
   * const { stream, mimeType } = await paymentDetailsService.openQr(vendor.id);
   * ```
   */
  async openQr(vendorId: string): Promise<TypedFile> {
    const details = await this.details.findByVendor(vendorId);
    const file =
      details?.qrStorageKey && (await this.storage.open(details.qrStorageKey));

    if (!details?.qrMimeType || !file) {
      this.logger.debug({
        method: 'openQr',
        message: 'No payment QR',
        vendorId,
      });
      throw new NotFoundException('Payment QR not found');
    }

    return {
      stream: file.stream,
      size: file.size,
      mimeType: details.qrMimeType,
    };
  }
}
