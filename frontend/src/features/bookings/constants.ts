/* mirror BookingStatus, PaymentStatus and PaymentMethod in backend/src/common/constants.ts */
export const BOOKING_STATUSES = ["confirmed", "completed", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PAYMENT_STATUSES = ["unpaid", "partial", "paid"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  partial: "Partial",
  paid: "Paid",
};

export const PAYMENT_METHODS = ["cash", "bank_transfer", "cheque", "esewa", "khalti"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  cheque: "Cheque",
  esewa: "eSewa",
  khalti: "Khalti",
};

/* mirror TEXT_MAX_LENGTH / LONG_TEXT_MAX_LENGTH in the backend */
export const BOOKING_LIMITS = { REFERENCE_MAX: 255, NOTE_MAX: 5000 } as const;
