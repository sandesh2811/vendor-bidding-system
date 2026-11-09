import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  BookingStatus,
  LONG_TEXT_MAX_LENGTH,
  PAYMENT,
} from '../../common/constants';
import { trim } from '../../common/transforms';

/* confirmed is the starting status, never a target */
export const BOOKING_TARGET_STATUSES = [
  BookingStatus.Completed,
  BookingStatus.Cancelled,
] as const;

export type BookingTargetStatus = (typeof BOOKING_TARGET_STATUSES)[number];

export class UpdateBookingDto {
  /* NPR; can't go below what's already paid (DB CHECK) */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0.01)
  @Max(PAYMENT.MAX_AMOUNT)
  amount?: number;

  @IsOptional()
  @IsIn(BOOKING_TARGET_STATUSES)
  status?: BookingTargetStatus;

  /* replaces the booking's notes; required with an amount change, as its reason */
  @ValidateIf(
    (dto: UpdateBookingDto) =>
      dto.amount !== undefined || dto.notes !== undefined,
  )
  @IsString()
  @Transform(trim)
  @IsNotEmpty({
    message: 'notes (the reason) is required when changing the amount',
  })
  @MaxLength(LONG_TEXT_MAX_LENGTH)
  notes?: string;
}
