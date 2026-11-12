import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../common/storage/storage.module';
import { QuotationItem } from './entities/quotation-item.entity';
import { QuotationPhoto } from './entities/quotation-photo.entity';
import { QuotationRecipient } from './entities/quotation-recipient.entity';
import { Quotation } from './entities/quotation.entity';
import { QuotationsController } from './controllers/quotations.controller';
import { QuotationsRepository } from './quotations.repository';
import { QuotationsService } from './quotations.service';
import { VendorQuotationsController } from './controllers/vendor-quotations.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Quotation,
      QuotationItem,
      QuotationPhoto,
      QuotationRecipient,
    ]),
    StorageModule,
  ],
  controllers: [QuotationsController, VendorQuotationsController],
  providers: [QuotationsRepository, QuotationsService],
})
export class QuotationsModule {}
