import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsUUID,
} from 'class-validator';
import { QUOTATION } from '../../common/constants';

export class AddRecipientsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(QUOTATION.MAX_RECIPIENTS)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  vendorIds: string[];
}
