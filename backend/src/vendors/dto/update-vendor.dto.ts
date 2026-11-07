import { OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateVendorDto } from './create-vendor.dto';

export class UpdateVendorDto extends PartialType(
  OmitType(CreateVendorDto, ['login'] as const),
) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
