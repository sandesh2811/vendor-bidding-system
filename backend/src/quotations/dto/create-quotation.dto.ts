import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  EventType,
  LONG_TEXT_MAX_LENGTH,
  QUOTATION,
  TEXT_MAX_LENGTH,
} from '../../common/constants';
import { trim } from '../../common/transforms';
import { IsNotPastDate } from '../../common/validators/is-not-past-date.validator';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DATE_ONLY_MESSAGE = '$property must be a date in YYYY-MM-DD format';

export class QuotationItemDto {
  @IsNotEmpty()
  @Transform(trim)
  @MaxLength(QUOTATION.TITLE_MAX_LENGTH)
  name: string;

  @IsInt()
  @Min(1)
  @Max(QUOTATION.MAX_QUANTITY)
  quantity: number;

  @IsOptional()
  @IsString()
  @Transform(trim)
  @MaxLength(QUOTATION.UNIT_MAX_LENGTH)
  unit?: string | null;

  @IsOptional()
  @IsString()
  @Transform(trim)
  @MaxLength(QUOTATION.ITEM_NOTES_MAX_LENGTH)
  notes?: string | null;
}

export class CreateQuotationDto {
  @IsNotEmpty()
  @Transform(trim)
  @MaxLength(QUOTATION.TITLE_MAX_LENGTH)
  title: string;

  @IsEnum(EventType)
  eventType: EventType;

  @Matches(DATE_ONLY, { message: DATE_ONLY_MESSAGE })
  @IsISO8601({ strict: true })
  @IsNotPastDate()
  eventDate: string;

  @IsNotEmpty()
  @Transform(trim)
  @MaxLength(TEXT_MAX_LENGTH)
  location: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(QUOTATION.MAX_GUESTS)
  guestCount?: number | null;

  /* must also be on or before eventDate: enforced by a DB CHECK so partial edits can't break it */
  @IsOptional()
  @Matches(DATE_ONLY, { message: DATE_ONLY_MESSAGE })
  @IsISO8601({ strict: true })
  @IsNotPastDate()
  responseDeadline?: string | null;

  @IsOptional()
  @IsString()
  @Transform(trim)
  @MaxLength(LONG_TEXT_MAX_LENGTH)
  description?: string | null;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(QUOTATION.MAX_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items: QuotationItemDto[];

  /* optional: create as a draft, attach photos, then send with POST /quotations/:id/recipients */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(QUOTATION.MAX_RECIPIENTS)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  vendorIds?: string[];
}
