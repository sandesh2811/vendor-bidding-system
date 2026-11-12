import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager, Repository } from 'typeorm';
import { VendorPaymentDetails } from './entities/vendor-payment-details.entity';

export type BankAccount = Pick<
  VendorPaymentDetails,
  'bankName' | 'accountName' | 'accountNumber' | 'branch'
>;

const NO_BANK: BankAccount = {
  bankName: null,
  accountName: null,
  accountNumber: null,
  branch: null,
};

@Injectable()
export class PaymentDetailsRepository {
  constructor(
    @InjectRepository(VendorPaymentDetails)
    private readonly repo: Repository<VendorPaymentDetails>,
  ) {}

  findByVendor(vendorId: string): Promise<VendorPaymentDetails | null> {
    return this.repo.findOneBy({ vendorId });
  }

  /* one INSERT … ON CONFLICT (vendor_id) DO UPDATE: creates the row on first use, replaces the bank fields after */
  async upsertBank(vendorId: string, bank: BankAccount): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(VendorPaymentDetails)
      .values({ vendorId, ...bank })
      .orUpdate(
        ['bank_name', 'account_name', 'account_number', 'branch', 'updated_at'],
        ['vendor_id'],
      )
      .execute();
  }

  /* a no-op when there is no row */
  async clearBank(vendorId: string): Promise<void> {
    await this.repo.update({ vendorId }, NO_BANK);
  }

  /**
   * Points the vendor's QR at a new stored file and returns the key it replaced (null if none).
   * The row lock makes concurrent uploads for an existing row apply one after the other, so each
   * one sees (and the caller removes) the file the other wrote.
   */
  replaceQr(
    vendorId: string,
    qrStorageKey: string,
    qrMimeType: string,
  ): Promise<string | null> {
    return this.repo.manager.transaction(async (manager) => {
      const previous = await this.lockQrKey(manager, vendorId);

      await manager
        .createQueryBuilder()
        .insert()
        .into(VendorPaymentDetails)
        .values({ vendorId, qrStorageKey, qrMimeType })
        .orUpdate(
          ['qr_storage_key', 'qr_mime_type', 'updated_at'],
          ['vendor_id'],
        )
        .execute();

      return previous;
    });
  }

  /* clears the QR under the same row lock and returns the removed key; null (and no write) when there was none */
  removeQr(vendorId: string): Promise<string | null> {
    return this.repo.manager.transaction(async (manager) => {
      const previous = await this.lockQrKey(manager, vendorId);

      if (previous)
        await manager.update(
          VendorPaymentDetails,
          { vendorId },
          { qrStorageKey: null, qrMimeType: null },
        );

      return previous;
    });
  }

  findQrKey(vendorId: string): Promise<string | null> {
    return this.repo
      .findOne({ where: { vendorId }, select: { qrStorageKey: true } })
      .then((row) => row?.qrStorageKey ?? null);
  }

  /* SELECT … FOR UPDATE on the vendor's row; null when there is no row (yet) or no QR */
  private async lockQrKey(
    manager: EntityManager,
    vendorId: string,
  ): Promise<string | null> {
    const row = await manager.findOne(VendorPaymentDetails, {
      where: { vendorId },
      select: { vendorId: true, qrStorageKey: true },
      lock: { mode: 'pessimistic_write' },
    });
    return row?.qrStorageKey ?? null;
  }
}
