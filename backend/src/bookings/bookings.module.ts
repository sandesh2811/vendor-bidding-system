import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './controllers/bookings.controller';
import { VendorBookingsController } from './controllers/vendor-bookings.controller';
import { BookingsRepository } from './bookings.repository';
import { BookingsService } from './bookings.service';
import { Booking } from './entities/booking.entity';
import { Payment } from './entities/payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Payment])],
  controllers: [BookingsController, VendorBookingsController],
  providers: [BookingsRepository, BookingsService],
})
export class BookingsModule {}
