import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotationItem } from './entities/quotation-item.entity';
import { QuotationPhoto } from './entities/quotation-photo.entity';
import { QuotationRecipient } from './entities/quotation-recipient.entity';
import { Quotation } from './entities/quotation.entity';
import { QuotationsController } from './controllers/quotations.controller';
import { QuotationsRepository } from './quotations.repository';
import { QuotationsService } from './quotations.service';
import { VendorQuotationsController } from './controllers/vendor-quotations.controller';
import { LocalPhotoStorage } from './storage/local-photo.storage';
import { PhotoStorage } from './storage/photo-storage';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Quotation,
      QuotationItem,
      QuotationPhoto,
      QuotationRecipient,
    ]),
  ],
  controllers: [QuotationsController, VendorQuotationsController],
  providers: [
    QuotationsRepository,
    QuotationsService,
    /* swap useClass for an object-storage adapter; nothing else changes */
    { provide: PhotoStorage, useClass: LocalPhotoStorage },
  ],
})
export class QuotationsModule {}
