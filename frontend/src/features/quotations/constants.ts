/* mirrors backend/src/common/constants.ts EventType */
export const EVENT_TYPES = ["wedding", "corporate", "birthday", "conference", "concert", "other"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  wedding: "Wedding",
  corporate: "Corporate",
  birthday: "Birthday",
  conference: "Conference",
  concert: "Concert",
  other: "Other",
};

/* limits mirror QUOTATION / QUOTATION_PHOTO in backend/src/common/constants.ts */
export const QUOTATION_LIMITS = {
  TITLE_MAX: 150,
  TEXT_MAX: 255,
  DESCRIPTION_MAX: 5000,
  MAX_ITEMS: 50,
  MAX_RECIPIENTS: 50,
  MAX_QUANTITY: 100_000,
  MAX_GUESTS: 100_000,
  UNIT_MAX: 30,
  ITEM_NOTES_MAX: 1000,
} as const;

export const PHOTO_LIMITS = {
  MAX_PER_QUOTATION: 10,
  MAX_BYTES: 5 * 1024 * 1024,
  /* the server re-checks the file's bytes; this only gives early feedback */
  TYPES: ["image/jpeg", "image/png", "image/webp"],
} as const;

/* mirrors QuotationStatus and BidStatus in backend/src/common/constants.ts */
export const QUOTATION_STATUSES = ["draft", "open", "closed", "awarded", "cancelled"] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
  awarded: "Awarded",
  cancelled: "Cancelled",
};

export type BidStatus = "submitted" | "selected" | "rejected";
