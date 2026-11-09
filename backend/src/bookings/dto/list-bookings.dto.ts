import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { BookingStatus, PaymentStatus } from '../../common/constants';
import {
  PaginationMetaDto,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';
import { Booking } from '../entities/booking.entity';

export class ListBookingsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsUUID()
  vendorId?: string;
}

export class BookingPageDto {
  items: Booking[];
  meta: PaginationMetaDto;
}
