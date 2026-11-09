import { IsUUID } from 'class-validator';
import { IdParamDto } from '../../common/dto/id-param.dto';

export class PaymentParamDto extends IdParamDto {
  @IsUUID()
  paymentId: string;
}
