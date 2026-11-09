import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Auth, CurrentVendor } from '../auth/auth.decorators';
import { UserRole } from '../common/constants';
import { UpdateVendorProfileDto } from './dto/update-vendor-profile.dto';
import type { VendorSummaryDto } from './dto/vendor-summary.dto';
import type { Vendor } from './entities/vendor.entity';
import { VendorPortalDocs } from './vendors.docs';
import { VendorsService } from './vendors.service';

/* vendor portal: always the session's own vendor; no admin serialization group, so admin notes are stripped */
@VendorPortalDocs.controller()
@Auth(UserRole.Vendor)
@Controller('vendor')
export class VendorPortalController {
  constructor(private readonly vendors: VendorsService) {}

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
}
