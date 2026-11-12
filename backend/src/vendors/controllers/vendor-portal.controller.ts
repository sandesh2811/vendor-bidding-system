import {
  Body,
  Controller,
  Delete,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  Put,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Auth, CurrentVendor } from '../../auth/auth.decorators';
import { UserRole, VENDOR_PAYMENT } from '../../common/constants';
import { toStreamableFile } from '../../common/storage/to-streamable-file';
import {
  ImageFileValidator,
  type UploadedFileData,
} from '../../common/validators/image-file.validator';
import { UpdateBankAccountDto } from '../dto/update-bank-account.dto';
import { UpdateVendorProfileDto } from '../dto/update-vendor-profile.dto';
import type { VendorSummaryDto } from '../dto/vendor-summary.dto';
import type { VendorPaymentDetails } from '../entities/vendor-payment-details.entity';
import type { Vendor } from '../entities/vendor.entity';
import { VendorPortalDocs } from '../vendors.docs';
import { PaymentDetailsService } from '../services/payment-details.service';
import { VendorsService } from '../services/vendors.service';

/* vendor portal: always the session's own vendor; no admin serialization group, so admin notes are stripped */
@VendorPortalDocs.controller()
@Auth(UserRole.Vendor)
@Controller('vendor')
export class VendorPortalController {
  constructor(
    private readonly vendors: VendorsService,
    private readonly paymentDetails: PaymentDetailsService,
  ) {}

  /* already loaded (and checked active) by VendorContextMiddleware */
  @Get('profile')
  @VendorPortalDocs.profile()
  profile(@CurrentVendor() vendor: Vendor): Vendor {
    return vendor;
  }

  /* the DTO whitelist limits this to business name, phone, contact person and address */
  @Patch('profile')
  @VendorPortalDocs.updateProfile()
  updateProfile(
    @CurrentVendor() vendor: Vendor,
    @Body() dto: UpdateVendorProfileDto,
  ): Promise<Vendor> {
    return this.vendors.update(vendor.id, dto);
  }

  @Get('summary')
  @VendorPortalDocs.summary()
  summary(@CurrentVendor() vendor: Vendor): Promise<VendorSummaryDto> {
    return this.vendors.summary(vendor.id);
  }

  @Get('payment-details')
  @VendorPortalDocs.paymentDetails()
  findPaymentDetails(
    @CurrentVendor() vendor: Vendor,
  ): Promise<VendorPaymentDetails> {
    return this.paymentDetails.find(vendor.id);
  }

  @Put('payment-details/bank')
  @VendorPortalDocs.updateBank()
  updateBank(
    @CurrentVendor() vendor: Vendor,
    @Body() dto: UpdateBankAccountDto,
  ): Promise<VendorPaymentDetails> {
    return this.paymentDetails.updateBank(vendor.id, dto);
  }

  @Delete('payment-details/bank')
  @VendorPortalDocs.clearBank()
  clearBank(@CurrentVendor() vendor: Vendor): Promise<VendorPaymentDetails> {
    return this.paymentDetails.clearBank(vendor.id);
  }

  /* memory storage: the file is validated (size, magic number) before anything touches the disk */
  @Put('payment-details/qr')
  @UseInterceptors(
    FileInterceptor('qr', {
      limits: { fileSize: VENDOR_PAYMENT.QR_MAX_BYTES, files: 1 },
    }),
  )
  @VendorPortalDocs.replaceQr()
  replaceQr(
    @CurrentVendor() vendor: Vendor,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: VENDOR_PAYMENT.QR_MAX_BYTES }),
          new ImageFileValidator(),
        ],
      }),
    )
    file: UploadedFileData,
  ): Promise<VendorPaymentDetails> {
    return this.paymentDetails.replaceQr(vendor.id, file);
  }

  @Delete('payment-details/qr')
  @VendorPortalDocs.removeQr()
  removeQr(@CurrentVendor() vendor: Vendor): Promise<VendorPaymentDetails> {
    return this.paymentDetails.removeQr(vendor.id);
  }

  @Get('payment-details/qr')
  @VendorPortalDocs.paymentQr()
  async paymentQr(@CurrentVendor() vendor: Vendor): Promise<StreamableFile> {
    return toStreamableFile(await this.paymentDetails.openQr(vendor.id));
  }
}
