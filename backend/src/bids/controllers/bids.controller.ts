import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  SerializeOptions,
} from '@nestjs/common';
import { Auth } from '../../auth/auth.decorators';
import type { Booking } from '../../bookings/entities/booking.entity';
import { UserRole } from '../../common/constants';
import { IdParamDto } from '../../common/dto/id-param.dto';
import { BidsDocs } from '../bids.docs';
import { BidsService } from '../bids.service';
import type { Bid } from '../entities/bid.entity';

@BidsDocs.controller()
@Auth(UserRole.Admin)
@SerializeOptions({ groups: [UserRole.Admin] })
@Controller()
export class BidsController {
  constructor(private readonly bids: BidsService) {}

  @Get('quotations/:id/bids')
  @BidsDocs.findForQuotation()
  findForQuotation(@Param() { id }: IdParamDto): Promise<Bid[]> {
    return this.bids.findForQuotation(id);
  }

  @Post('bids/:id/select')
  @HttpCode(HttpStatus.OK)
  @BidsDocs.select()
  select(@Param() { id }: IdParamDto): Promise<Booking> {
    return this.bids.select(id);
  }
}
