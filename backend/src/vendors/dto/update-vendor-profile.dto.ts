import { PartialType, PickType } from '@nestjs/swagger';
import { CreateVendorDto } from './create-vendor.dto';

/* what a vendor may change about itself; emails, login, category, status and notes stay admin-only */
export class UpdateVendorProfileDto extends PartialType(
  PickType(CreateVendorDto, [
    'name',
    'phone',
    'contactName',
    'address',
  ] as const),
) {}
