export const API_PREFIX = 'api';
export const API_DEFAULT_VERSION = '1';
export const SWAGGER_PATH = 'api/docs';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const ROLES_KEY = 'roles';

/* fixed windows, per client IP (see common/rate-limit.ts) */
export const RATE_LIMIT = {
  API: { WINDOW_MS: 60 * 1000, LIMIT: 300 },
  LOGIN: { WINDOW_MS: 15 * 60 * 1000, LIMIT: 10 },
} as const;

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
  DECLINE_REASON_MAX_LENGTH: 1000,
} as const;

/* numeric(12,2): the largest unit price a column can hold; larger line totals are a 400 (PG 22003) */
export const BID = {
  MAX_UNIT_PRICE: 9_999_999_999.99,
} as const;

export const PAYMENT = {
  MAX_AMOUNT: BID.MAX_UNIT_PRICE,
} as const;

/* stored file extension by detected (magic-number) type, see common/image-type.ts */
export const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const QUOTATION_PHOTO = {
  MAX_PER_QUOTATION: 10,
  MAX_BYTES: 5 * 1024 * 1024,
  EXTENSIONS: IMAGE_EXTENSIONS,
} as const;

/* where Mero Event sends a vendor's money: a bank account and/or a payment QR image */
export const VENDOR_PAYMENT = {
  /* IBAN length, the longest common account format; Nepali account numbers are shorter */
  ACCOUNT_NUMBER_MAX_LENGTH: 34,
  QR_MAX_BYTES: 2 * 1024 * 1024,
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
  NUMERIC_OUT_OF_RANGE: '22003',
} as const;

/* DB UNIQUE constraints with a domain message; others fall back to "<column> already exists" */
export const UNIQUE_CONSTRAINTS = {
  QUOTATION_EVENT: {
    name: 'UQ_quotations_title_event_date_location',
    message:
      'A quotation with this title, event date and location already exists',
  },
  BID_QUOTATION_VENDOR: {
    name: 'UQ_bids_quotation_vendor',
    message: 'This vendor already has a bid on this quotation',
  },
  BID_ITEM: {
    name: 'UQ_bid_items_bid_quotation_item',
    message: 'Each item may be priced only once',
  },
  BOOKING_QUOTATION: {
    name: 'UQ_bookings_quotation',
    message: 'This quotation already has a booking',
  },
  BOOKING_BID: {
    name: 'UQ_bookings_bid',
    message: 'This bid already has a booking',
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
  BID_UNIT_PRICE: {
    name: 'CHK_bid_items_unit_price_non_negative',
    message: 'unitPrice must be 0 or more',
  },
  /* one rule for both overpaying and lowering the amount below what's paid */
  BOOKING_PAID: {
    name: 'CHK_bookings_paid_within_amount',
    message: "Payments can't exceed the booking amount",
  },
  PAYMENT_AMOUNT: {
    name: 'CHK_payments_amount_positive',
    message: 'amount must be more than 0',
  },
  /* bank name, account name and number are set together or not at all */
  VENDOR_BANK_COMPLETE: {
    name: 'CHK_vendor_payment_details_bank_complete',
    message: 'Bank name, account name and account number go together',
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

export enum QuotationStatus {
  Draft = 'draft',
  Open = 'open',
  Closed = 'closed',
  Awarded = 'awarded',
  Cancelled = 'cancelled',
}

export enum BidStatus {
  Submitted = 'submitted',
  Selected = 'selected',
  Rejected = 'rejected',
}

export enum BookingStatus {
  Confirmed = 'confirmed',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum PaymentStatus {
  Unpaid = 'unpaid',
  Partial = 'partial',
  Paid = 'paid',
}

export enum PaymentMethod {
  Cash = 'cash',
  BankTransfer = 'bank_transfer',
  Cheque = 'cheque',
  Esewa = 'esewa',
  Khalti = 'khalti',
}
