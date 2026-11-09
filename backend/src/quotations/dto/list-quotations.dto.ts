import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  BidStatus,
  EventType,
  NAME_MAX_LENGTH,
  QuotationStatus,
} from '../../common/constants';
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

  /* effective status: an open quotation past its deadline counts as closed */
  @IsOptional()
  @IsEnum(QuotationStatus)
  status?: QuotationStatus;
}

/* an admin list row: the quotation plus how many vendors have bid on it */
export class ListedQuotationDto extends Quotation {
  @ApiProperty()
  bidCount: number;
}

export class QuotationPageDto {
  items: ListedQuotationDto[];
  meta: PaginationMetaDto;
}

/* what a vendor sees: the quotation plus when it was sent to them, never the other recipients */
export class ReceivedQuotationDto extends Quotation {
  @ApiProperty()
  receivedAt: Date;

  /* this vendor's own bid, null until it bids */
  @ApiProperty({ enum: BidStatus, nullable: true })
  bidStatus: BidStatus | null;

  /* this vendor's own invitation: first opened, and declined (null if not) */
  @ApiProperty({ nullable: true })
  viewedAt: Date | null;

  @ApiProperty({ nullable: true })
  declinedAt: Date | null;
}

export class ReceivedQuotationPageDto {
  items: ReceivedQuotationDto[];
  meta: PaginationMetaDto;
}
