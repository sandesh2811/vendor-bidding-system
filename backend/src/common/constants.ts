export const API_PREFIX = 'api';
export const API_DEFAULT_VERSION = '1';
export const SWAGGER_PATH = 'api/docs';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const ROLES_KEY = 'roles';

export const BCRYPT_COST = 12;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;
export const EMAIL_MAX_LENGTH = 254;
export const NAME_MAX_LENGTH = 100;
export const TEXT_MAX_LENGTH = 255;
export const LONG_TEXT_MAX_LENGTH = 5000;

/* "today" for date-only fields (event dates, deadlines) is judged in Nepal time, not UTC */
export const BUSINESS_TIME_ZONE = 'Asia/Kathmandu';

export const QUOTATION = {
  TITLE_MAX_LENGTH: 150,
  MAX_ITEMS: 50,
  MAX_RECIPIENTS: 50,
  MAX_QUANTITY: 100_000,
  MAX_GUESTS: 100_000,
  UNIT_MAX_LENGTH: 30,
  ITEM_NOTES_MAX_LENGTH: 1000,
} as const;

export const QUOTATION_PHOTO = {
  MAX_PER_QUOTATION: 10,
  MAX_BYTES: 5 * 1024 * 1024,
  /* by detected (magic-number) type, see common/image-type.ts */
  EXTENSIONS: {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  } as Record<string, string>,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const PG_ERROR_CODE = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  CHECK_VIOLATION: '23514',
  NOT_NULL_VIOLATION: '23502',
} as const;

/* DB UNIQUE constraints with a domain message; others fall back to "<column> already exists" */
export const UNIQUE_CONSTRAINTS = {
  QUOTATION_EVENT: {
    name: 'UQ_quotations_title_event_date_location',
    message:
      'A quotation with this title, event date and location already exists',
  },
} as const;

/* DB CHECK constraints (named in entities) and the 400 message each maps to in DatabaseException */
export const CHECK_CONSTRAINTS = {
  QUOTATION_DEADLINE: {
    name: 'CHK_quotations_deadline_before_event',
    message: 'responseDeadline must be on or before eventDate',
  },
  QUOTATION_GUESTS: {
    name: 'CHK_quotations_guest_count_positive',
    message: 'guestCount must be at least 1',
  },
  ITEM_QUANTITY: {
    name: 'CHK_quotation_items_quantity_positive',
    message: 'quantity must be at least 1',
  },
} as const;

export enum UserRole {
  Admin = 'admin',
  Vendor = 'vendor',
}

export enum VendorCategory {
  Catering = 'catering',
  Decor = 'decor',
  Sound = 'sound',
  Venue = 'venue',
  Photo = 'photo',
  Other = 'other',
}

export enum EventType {
  Wedding = 'wedding',
  Corporate = 'corporate',
  Birthday = 'birthday',
  Conference = 'conference',
  Concert = 'concert',
  Other = 'other',
}
