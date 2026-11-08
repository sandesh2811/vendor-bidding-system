import { OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { QUOTATION } from '../../common/constants';
import { CreateQuotationDto, QuotationItemDto } from './create-quotation.dto';

export class UpdateQuotationItemDto extends QuotationItemDto {
  /* present: update that item; absent: add a new item */
  @IsOptional()
  @IsUUID()
  id?: string;
}

export class UpdateQuotationDto extends PartialType(
  OmitType(CreateQuotationDto, ['items', 'vendorIds'] as const),
) {
  /* the full desired item list: listed ids are updated, new entries added, missing items removed */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(QUOTATION.MAX_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => UpdateQuotationItemDto)
  items?: UpdateQuotationItemDto[];
}
