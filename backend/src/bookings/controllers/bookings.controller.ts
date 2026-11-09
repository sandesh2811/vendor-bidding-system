import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  SerializeOptions,
} from '@nestjs/common';
import { Auth, CurrentUser } from '../../auth/auth.decorators';
import { UserRole } from '../../common/constants';
import { IdParamDto } from '../../common/dto/id-param.dto';
import type { Paginated } from '../../common/pagination.helper';
import type { User } from '../../users/entities/user.entity';
import { BookingsDocs } from '../bookings.docs';
import { BookingsService } from '../bookings.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { ListBookingsQueryDto } from '../dto/list-bookings.dto';
import { PaymentParamDto } from '../dto/payment-param.dto';
import { UpdateBookingDto } from '../dto/update-booking.dto';
import type { Booking } from '../entities/booking.entity';
import type { Payment } from '../entities/payment.entity';

@BookingsDocs.controller()
@Auth(UserRole.Admin)
@SerializeOptions({ groups: [UserRole.Admin] })
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get()
  @BookingsDocs.findAll()
  findAll(@Query() query: ListBookingsQueryDto): Promise<Paginated<Booking>> {
    return this.bookings.findAll(query);
  }

  @Get(':id')
  @BookingsDocs.findOne()
  findOne(@Param() { id }: IdParamDto): Promise<Booking> {
    return this.bookings.findOne(id);
  }

  @Patch(':id')
  @BookingsDocs.update()
  update(
    @Param() { id }: IdParamDto,
    @Body() dto: UpdateBookingDto,
  ): Promise<Booking> {
    return this.bookings.update(id, dto);
  }

  /* shortcut: a retried POST records the payment twice (capped by the overpay CHECK); add retry protection once an approach is chosen */
  @Post(':id/payments')
  @BookingsDocs.addPayment()
  addPayment(
    @Param() { id }: IdParamDto,
    @Body() dto: CreatePaymentDto,
    @CurrentUser() admin: User,
  ): Promise<Payment> {
    return this.bookings.addPayment(id, dto, admin.id);
  }

  @Delete(':id/payments/:paymentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @BookingsDocs.deletePayment()
  deletePayment(@Param() { id, paymentId }: PaymentParamDto): Promise<void> {
    return this.bookings.deletePayment(id, paymentId);
  }
}
