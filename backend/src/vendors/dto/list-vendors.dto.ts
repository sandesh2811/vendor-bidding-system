import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { NAME_MAX_LENGTH, VendorCategory } from '../../common/constants';
import {
  PaginationMetaDto,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';
import { toBoolean, trim } from '../../common/transforms';
import { Vendor } from '../vendor.entity';

export class ListVendorsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @Transform(trim)
  @MaxLength(NAME_MAX_LENGTH)
  search?: string;

  @IsOptional()
  @IsEnum(VendorCategory)
  category?: VendorCategory;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isActive?: boolean;
}

export class VendorPageDto {
  items: Vendor[];
  meta: PaginationMetaDto;
}
