import type { BidStatus } from "@/features/quotations/constants";
import type { Vendor } from "@/features/vendors/types";

/* amounts are NPR decimal strings, e.g. "9000.00"; the server computes every total */
export interface BidItem {
  id: string;
  bidId: string;
  quotationItemId: string;
  unitPrice: string;
  lineTotal: string;
}

export interface Bid {
  id: string;
  quotationId: string;
  vendorId: string;
  status: BidStatus;
  totalAmount: string;
  notes: string | null;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
  items: BidItem[];
}

/* admin comparison row */
export interface ComparedBid extends Bid {
  vendor: Vendor;
}

export interface Booking {
  id: string;
  quotationId: string;
  bidId: string;
  vendorId: string;
  amount: string;
  status: "confirmed" | "completed" | "cancelled";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitBidInput {
  items: { quotationItemId: string; unitPrice: number }[];
  notes: string | null;
  validUntil: string | null;
}
