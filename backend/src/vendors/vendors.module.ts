import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../common/storage/storage.module';
import { UsersModule } from '../users/users.module';
import { VendorPaymentDetails } from './entities/vendor-payment-details.entity';
import { Vendor } from './entities/vendor.entity';
import { PaymentDetailsRepository } from './payment-details.repository';
import { PaymentDetailsService } from './services/payment-details.service';
import { VendorPortalController } from './controllers/vendor-portal.controller';
import { VendorsController } from './controllers/vendors.controller';
import { VendorsRepository } from './vendors.repository';
import { VendorsService } from './services/vendors.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vendor, VendorPaymentDetails]),
    UsersModule,
    StorageModule,
  ],
  controllers: [VendorsController, VendorPortalController],
  providers: [
    VendorsRepository,
    VendorsService,
    PaymentDetailsRepository,
    PaymentDetailsService,
  ],
  exports: [VendorsService],
})
export class VendorsModule {}
