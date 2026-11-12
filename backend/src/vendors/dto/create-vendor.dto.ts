import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  EMAIL_MAX_LENGTH,
  LONG_TEXT_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  TEXT_MAX_LENGTH,
  VendorCategory,
} from '../../common/constants';
import { normalizeEmail, trim } from '../../common/transforms';

export class VendorLoginDto {
  @IsNotEmpty()
  @Transform(trim)
  @MaxLength(NAME_MAX_LENGTH)
  name: string;

  @IsEmail()
  @MaxLength(EMAIL_MAX_LENGTH)
  @Transform(normalizeEmail)
  email: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  password: string;
}

export class CreateVendorDto {
  @IsNotEmpty()
  @Transform(trim)
  @MaxLength(NAME_MAX_LENGTH)
  name: string;

  @IsEnum(VendorCategory)
  category: VendorCategory;

  @IsNotEmpty()
  @Transform(trim)
  @MaxLength(TEXT_MAX_LENGTH)
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(NAME_MAX_LENGTH)
  contactName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(EMAIL_MAX_LENGTH)
  @Transform(normalizeEmail)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(TEXT_MAX_LENGTH)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(LONG_TEXT_MAX_LENGTH)
  notes?: string;

  @ValidateNested()
  @Type(() => VendorLoginDto)
  login: VendorLoginDto;
}
