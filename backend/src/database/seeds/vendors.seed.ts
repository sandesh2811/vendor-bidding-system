import type { INestApplicationContext } from '@nestjs/common';
import { VendorCategory } from '../../common/constants';
import type { CreateVendorDto } from '../../vendors/dto/create-vendor.dto';
import { VendorsService } from '../../vendors/vendors.service';

const DEMO_PASSWORD = 'Vendor@12345';

/* phones are unique, so other seeders (quotations) find the demo vendors by them */
export const DEMO_VENDOR_PHONES = {
  decor: '9800000001',
  catering: '9800000002',
  sound: '9800000003',
} as const;

const VENDORS: CreateVendorDto[] = [
  {
    name: 'Himalayan Decor',
    category: VendorCategory.Decor,
    phone: DEMO_VENDOR_PHONES.decor,
    contactName: 'Sita Gurung',
    login: {
      name: 'Sita Gurung',
      email: 'decor@vendor.test',
      password: DEMO_PASSWORD,
    },
  },
  {
    name: 'Kathmandu Caterers',
    category: VendorCategory.Catering,
    phone: DEMO_VENDOR_PHONES.catering,
    contactName: 'Ram Shrestha',
    login: {
      name: 'Ram Shrestha',
      email: 'catering@vendor.test',
      password: DEMO_PASSWORD,
    },
  },
  {
    name: 'Everest Sound',
    category: VendorCategory.Sound,
    phone: DEMO_VENDOR_PHONES.sound,
    login: {
      name: 'Everest Sound',
      email: 'sound@vendor.test',
      password: DEMO_PASSWORD,
    },
  },
];

export async function seedVendors(app: INestApplicationContext): Promise<void> {
  const vendors = app.get(VendorsService);

  for (const vendor of VENDORS) await vendors.create(vendor);
}
