import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength } from 'class-validator';
import { PASSWORD_MAX_LENGTH } from '../../common/constants';
import { normalizeEmail } from '../../common/transforms';

export class LoginDto {
  @IsEmail()
  @Transform(normalizeEmail)
  email: string;

  @IsString()
  @MaxLength(PASSWORD_MAX_LENGTH)
  password: string;
}
