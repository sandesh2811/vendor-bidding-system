import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { BidsController } from './controllers/bids.controller';
import { VendorBidsController } from './controllers/vendor-bids.controller';
import { BidsRepository } from './bids.repository';
import { BidsService } from './bids.service';
import { BidItem } from './entities/bid-item.entity';
import { Bid } from './entities/bid.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bid, BidItem, Booking])],
  controllers: [BidsController, VendorBidsController],
  providers: [BidsRepository, BidsService],
})
export class BidsModule {}
