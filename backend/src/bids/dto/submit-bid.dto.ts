import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { BID, LONG_TEXT_MAX_LENGTH, QUOTATION } from '../../common/constants';
import { trim } from '../../common/transforms';
import { IsNotPastDate } from '../../common/validators/is-not-past-date.validator';

export class BidItemDto {
  @IsUUID('all')
  quotationItemId: string;

  /* NPR; 0 means "not offered". Line totals are computed by the server */
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(BID.MAX_UNIT_PRICE)
  unitPrice: number;
}

export class SubmitBidDto {
  /* every item of the quotation, exactly once; completeness is checked against the DB */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(QUOTATION.MAX_ITEMS)
  @ArrayUnique((item: BidItemDto) => item.quotationItemId, {
    message: 'Each item may be priced only once',
  })
  @ValidateNested({ each: true })
  @Type(() => BidItemDto)
  items: BidItemDto[];

  @IsOptional()
  @IsString()
  @Transform(trim)
  @MaxLength(LONG_TEXT_MAX_LENGTH)
  notes?: string | null;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: '$property must be a date in YYYY-MM-DD format',
  })
  @IsISO8601({ strict: true })
  @IsNotPastDate()
  validUntil?: string | null;
}
