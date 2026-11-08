import { IsUUID } from 'class-validator';
import { IdParamDto } from '../../common/dto/id-param.dto';

export class PhotoParamDto extends IdParamDto {
  @IsUUID()
  photoId: string;
}
