import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { QUOTATION } from '../../common/constants';
import { trim } from '../../common/transforms';

export class DeclineQuotationDto {
  /* optional; shown to the admin next to the vendor */
  @IsOptional()
  @IsString()
  @Transform(trim)
  @MaxLength(QUOTATION.DECLINE_REASON_MAX_LENGTH)
  reason?: string | null;
}
