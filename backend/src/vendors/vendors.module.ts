import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { Vendor } from './entities/vendor.entity';
import { VendorPortalController } from './vendor-portal.controller';
import { VendorsController } from './vendors.controller';
import { VendorsRepository } from './vendors.repository';
import { VendorsService } from './vendors.service';

@Module({
  imports: [TypeOrmModule.forFeature([Vendor]), UsersModule],
  controllers: [VendorsController, VendorPortalController],
  providers: [VendorsRepository, VendorsService],
  exports: [VendorsService],
})
export class VendorsModule {}
