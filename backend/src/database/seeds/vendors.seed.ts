import type { INestApplicationContext } from '@nestjs/common';
import { VendorCategory } from '../../common/constants';
import type { CreateVendorDto } from '../../vendors/dto/create-vendor.dto';
import { VendorsService } from '../../vendors/vendors.service';

const DEMO_PASSWORD = 'Vendor@12345';

const VENDORS: CreateVendorDto[] = [
  {
    name: 'Himalayan Decor',
    category: VendorCategory.Decor,
    phone: '9800000001',
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
    phone: '9800000002',
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
    phone: '9800000003',
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
