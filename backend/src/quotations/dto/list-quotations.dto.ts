import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { EventType, NAME_MAX_LENGTH } from '../../common/constants';
import {
  PaginationMetaDto,
  PaginationQueryDto,
} from '../../common/dto/pagination.dto';
import { trim } from '../../common/transforms';
import { Quotation } from '../entities/quotation.entity';

export class ListQuotationsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @Transform(trim)
  @MaxLength(NAME_MAX_LENGTH)
  search?: string;

  @IsOptional()
  @IsEnum(EventType)
  eventType?: EventType;
}

export class QuotationPageDto {
  items: Quotation[];
  meta: PaginationMetaDto;
}

/* what a vendor sees: the quotation plus when it was sent to them, never the other recipients */
export class ReceivedQuotationDto extends Quotation {
  @ApiProperty()
  receivedAt: Date;
}

export class ReceivedQuotationPageDto {
  items: ReceivedQuotationDto[];
  meta: PaginationMetaDto;
}
