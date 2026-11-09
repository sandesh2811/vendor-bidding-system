import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { Auth, CurrentVendor } from '../../auth/auth.decorators';
import { UserRole } from '../../common/constants';
import { IdParamDto } from '../../common/dto/id-param.dto';
import type { Vendor } from '../../vendors/entities/vendor.entity';
import { VendorBidsDocs } from '../bids.docs';
import { BidsService } from '../bids.service';
import { SubmitBidDto } from '../dto/submit-bid.dto';
import type { Bid } from '../entities/bid.entity';

/* vendor portal: the bid always belongs to the session's vendor, never to an id from the request */
@VendorBidsDocs.controller()
@Auth(UserRole.Vendor)
@Controller('vendor/quotations')
export class VendorBidsController {
  constructor(private readonly bids: BidsService) {}

  @Put(':id/bid')
  @VendorBidsDocs.submit()
  submit(
    @CurrentVendor() vendor: Vendor,
    @Param() { id }: IdParamDto,
    @Body() dto: SubmitBidDto,
  ): Promise<Bid> {
    return this.bids.submit(vendor.id, id, dto);
  }

  @Get(':id/bid')
  @VendorBidsDocs.findOwn()
  findOwn(
    @CurrentVendor() vendor: Vendor,
    @Param() { id }: IdParamDto,
  ): Promise<Bid> {
    return this.bids.findOwn(vendor.id, id);
  }
}
