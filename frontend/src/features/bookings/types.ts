import type { Bid } from "@/features/bids/types";
import type { QuotationEvent, QuotationItem } from "@/features/quotations/types";
import type { Vendor } from "@/features/vendors/types";
import type { BookingStatus, PaymentMethod, PaymentStatus } from "./constants";

/* amounts are NPR decimal strings, e.g. "9000.00"; paid, pending and payment status come from the server */
export interface Payment {
  id: string;
  bookingId: string;
  amount: string;
  /* YYYY-MM-DD */
  paidAt: string;
  method: PaymentMethod;
  reference: string | null;
  /* admin only */
  note?: string | null;
  recordedById?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  quotationId: string;
  bidId: string;
  vendorId: string;
  amount: string;
  paidAmount: string;
  pendingAmount: string;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  /* admin only */
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  quotation: QuotationEvent;
  vendor: Vendor;
}

export interface BookingDetail extends Booking {
  payments: Payment[];
}

/* vendor portal: the event with its items, the winning bid's lines, and the payments */
export interface VendorBookingDetail extends Omit<Booking, "vendor" | "quotation"> {
  quotation: QuotationEvent & { items: QuotationItem[] };
  bid: Bid;
  payments: Payment[];
}

export interface ListBookingsParams {
  page: number;
  limit: number;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
}

export interface UpdateBookingInput {
  amount?: number;
  status?: "completed" | "cancelled";
  notes?: string;
}

export interface CreatePaymentInput {
  amount: number;
  paidAt: string;
  method: PaymentMethod;
  reference: string | null;
  note: string | null;
}
