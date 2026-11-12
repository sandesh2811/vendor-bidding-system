import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { NAME_MAX_LENGTH, VENDOR_PAYMENT } from '../../common/constants';
import { trim } from '../../common/transforms';

/* the full bank account; it replaces the stored one */
export class UpdateBankAccountDto {
  @IsString()
  @Transform(trim)
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
  bankName: string;

  @IsString()
  @Transform(trim)
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
  accountName: string;

  /* letters, digits, spaces and dashes, as printed on statements */
  @IsString()
  @Transform(trim)
  @Matches(/^[A-Za-z0-9][A-Za-z0-9 -]*$/, {
    message:
      'accountNumber may only contain letters, digits, spaces and dashes',
  })
  @MaxLength(VENDOR_PAYMENT.ACCOUNT_NUMBER_MAX_LENGTH)
  accountNumber: string;

  @IsOptional()
  @IsString()
  @Transform(trim)
  @MaxLength(NAME_MAX_LENGTH)
  branch?: string;
}
