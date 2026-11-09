import { Controller, Get, Param, Query } from '@nestjs/common';
import { Auth, CurrentVendor } from '../../auth/auth.decorators';
import { UserRole } from '../../common/constants';
import { IdParamDto } from '../../common/dto/id-param.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import type { Paginated } from '../../common/pagination.helper';
import type { Vendor } from '../../vendors/entities/vendor.entity';
import { VendorBookingsDocs } from '../bookings.docs';
import { BookingsService } from '../bookings.service';
import type { Booking } from '../entities/booking.entity';

/* vendor portal: scoped by the session's vendor; no admin serialization group, so notes and recorder are stripped */
@VendorBookingsDocs.controller()
@Auth(UserRole.Vendor)
@Controller('vendor/bookings')
export class VendorBookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get()
  @VendorBookingsDocs.findAll()
  findAll(
    @CurrentVendor() vendor: Vendor,
    @Query() page: PaginationQueryDto,
  ): Promise<Paginated<Booking>> {
    return this.bookings.findVendorBookings(vendor.id, page);
  }

  @Get(':id')
  @VendorBookingsDocs.findOne()
  findOne(
    @CurrentVendor() vendor: Vendor,
    @Param() { id }: IdParamDto,
  ): Promise<Booking> {
    return this.bookings.findVendorBooking(vendor.id, id);
  }
}
