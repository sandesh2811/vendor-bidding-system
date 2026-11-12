/* mirrors backend/src/common/constants.ts VendorCategory */
export const VENDOR_CATEGORIES = ["catering", "decor", "sound", "venue", "photo", "other"] as const;
export type VendorCategory = (typeof VENDOR_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<VendorCategory, string> = {
  catering: "Catering",
  decor: "Decoration",
  sound: "Sound & DJ",
  venue: "Venue",
  photo: "Photography",
  other: "Other",
};

/* limits mirror backend/src/common/constants.ts */
export const VENDOR_LIMITS = {
  NAME_MAX: 100,
  TEXT_MAX: 255,
  NOTES_MAX: 5000,
  EMAIL_MAX: 254,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 72,
} as const;

/* mirrors VENDOR_PAYMENT in backend/src/common/constants.ts; the server re-checks the QR's bytes */
export const PAYMENT_LIMITS = {
  ACCOUNT_NUMBER_MAX: 34,
  QR_MAX_BYTES: 2 * 1024 * 1024,
  QR_TYPES: ["image/jpeg", "image/png", "image/webp"],
} as const;
