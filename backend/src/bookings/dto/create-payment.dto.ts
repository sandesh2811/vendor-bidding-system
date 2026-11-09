import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  LONG_TEXT_MAX_LENGTH,
  PAYMENT,
  PaymentMethod,
  TEXT_MAX_LENGTH,
} from '../../common/constants';
import { trim } from '../../common/transforms';
import { IsNotFutureDate } from '../../common/validators/is-not-past-date.validator';

export class CreatePaymentDto {
  /* NPR; at most the pending amount (DB CHECK on the booking) */
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0.01)
  @Max(PAYMENT.MAX_AMOUNT)
  amount: number;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: '$property must be a date in YYYY-MM-DD format',
  })
  @IsISO8601({ strict: true })
  @IsNotFutureDate()
  paidAt: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  /* transaction id or cheque number */
  @IsOptional()
  @IsString()
  @Transform(trim)
  @MaxLength(TEXT_MAX_LENGTH)
  reference?: string | null;

  @IsOptional()
  @IsString()
  @Transform(trim)
  @MaxLength(LONG_TEXT_MAX_LENGTH)
  note?: string | null;
}
