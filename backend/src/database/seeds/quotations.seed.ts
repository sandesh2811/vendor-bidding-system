import { type INestApplicationContext, Logger } from '@nestjs/common';
import { EventType, PAGINATION } from '../../common/constants';
import { businessToday } from '../../common/validators/is-not-past-date.validator';
import type { CreateQuotationDto } from '../../quotations/dto/create-quotation.dto';
import { QuotationsService } from '../../quotations/quotations.service';
import { UsersService } from '../../users/users.service';
import { VendorsService } from '../../vendors/vendors.service';
import { SUPER_ADMIN } from './admin.seed';
import { DEMO_VENDOR_PHONES } from './vendors.seed';

const logger = new Logger('QuotationsSeed');

/* YYYY-MM-DD `days` after today (Nepal time), so seeded events are always in the future */
const daysFromToday = (days: number): string => {
  const date = new Date(`${businessToday()}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

type SeedQuotation = Omit<CreateQuotationDto, 'vendorIds'> & {
  /* recipients by demo vendor phone; empty leaves the quotation as a draft */
  sendTo: string[];
};

const { decor, catering, sound } = DEMO_VENDOR_PHONES;

/* built per run: dates are relative to the day the seed runs */
const quotations = (): SeedQuotation[] => [
  {
    title: 'Sharma wedding reception',
    eventType: EventType.Wedding,
    eventDate: daysFromToday(45),
    location: 'Hotel Yak & Yeti, Kathmandu',
    guestCount: 300,
    responseDeadline: daysFromToday(14),
    description: 'Evening reception, gold and ivory theme. Setup from 2 pm.',
    items: [
      {
        name: 'Stage decoration',
        quantity: 1,
        notes: 'Floral backdrop, 24 ft wide',
      },
      { name: 'Round tables with linen', quantity: 30, unit: 'pcs' },
      {
        name: 'Buffet dinner',
        quantity: 300,
        unit: 'plates',
        notes: 'Veg and non-veg',
      },
    ],
    sendTo: [decor, catering],
  },
  {
    title: 'Annual partners meet',
    eventType: EventType.Corporate,
    eventDate: daysFromToday(30),
    location: 'Soaltee Crowne Plaza, Kathmandu',
    guestCount: 150,
    responseDeadline: daysFromToday(7),
    items: [
      { name: 'PA system with wireless mics', quantity: 1, unit: 'set' },
      { name: 'High tea', quantity: 150, unit: 'guests' },
    ],
    sendTo: [sound, catering],
  },
  {
    title: "Aarav's 10th birthday",
    eventType: EventType.Birthday,
    eventDate: daysFromToday(20),
    location: 'Jhamsikhel, Lalitpur',
    guestCount: 60,
    items: [{ name: 'Balloon arch and table decor', quantity: 1, unit: 'set' }],
    sendTo: [decor],
  },
  {
    title: 'Kathmandu startup summit',
    eventType: EventType.Conference,
    eventDate: daysFromToday(90),
    location: 'Nepal Academy Hall, Kathmandu',
    guestCount: 500,
    description: 'Draft: venue confirmed, vendors not chosen yet.',
    items: [
      { name: 'Stage lighting', quantity: 1, unit: 'set' },
      { name: 'Lunch boxes', quantity: 500, unit: 'pcs' },
    ],
    sendTo: [],
  },
];

/**
 * Demo quotations sent to the demo vendors. Runs after the admin and vendor seeders.
 *
 * @remarks
 * - Goes through QuotationsService, so the same rules apply: one transaction per quotation,
 *   recipients must be existing active vendors (real FKs), and dates pass the DB CHECKs.
 * - Re-runnable: a title that already exists is skipped, since the dates (and so the natural key)
 *   move with the day the seed runs.
 * - No photos: the seed has no image files to upload.
 */
export async function seedQuotations(
  app: INestApplicationContext,
): Promise<void> {
  const service = app.get(QuotationsService);
  /* idempotent on email: returns the existing admin */
  const admin = await app.get(UsersService).createAdmin(SUPER_ADMIN);

  const { items: vendors } = await app
    .get(VendorsService)
    .findAll({ page: 1, limit: PAGINATION.MAX_LIMIT, isActive: true });
  const vendorIdByPhone = new Map(vendors.map((v) => [v.phone, v.id]));

  for (const { sendTo, ...quotation } of quotations()) {
    const { items: matches } = await service.findAll({
      page: 1,
      limit: PAGINATION.MAX_LIMIT,
      search: quotation.title,
    });
    if (matches.some((existing) => existing.title === quotation.title)) {
      logger.log({
        method: 'seedQuotations',
        message: 'Skipped, already seeded',
        title: quotation.title,
      });
      continue;
    }

    /* a demo vendor missing or deactivated is left out rather than failing the whole seed */
    const vendorIds = sendTo.flatMap((phone) => {
      const id = vendorIdByPhone.get(phone);
      return id ? [id] : [];
    });

    await service.create({ ...quotation, vendorIds }, admin.id);
  }
}
