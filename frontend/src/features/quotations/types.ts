import type { Vendor } from "@/features/vendors/types";
import type { BidStatus, EventType, QuotationStatus } from "./constants";

export interface QuotationItem {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  notes: string | null;
  position: number;
}

export interface QuotationPhoto {
  id: string;
  quotationId: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface QuotationRecipient {
  id: string;
  vendorId: string;
  sentAt: string;
  vendor: Vendor;
}

/* event fields shared by the admin and vendor views; dates are YYYY-MM-DD */
export interface QuotationEvent {
  id: string;
  title: string;
  eventType: EventType;
  eventDate: string;
  location: string;
  guestCount: number | null;
  responseDeadline: string | null;
  description: string | null;
  /* effective: an open quotation past its deadline comes back as closed */
  status: QuotationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationContents {
  items: QuotationItem[];
  photos: QuotationPhoto[];
}

/* admin list row */
export interface Quotation extends QuotationEvent {
  recipients: QuotationRecipient[];
}

export type QuotationDetail = Quotation & QuotationContents;

/* vendor portal: a quotation as one recipient sees it, without the other recipients */
export interface ReceivedQuotation extends QuotationEvent {
  receivedAt: string;
  /* this vendor's own bid, null until it bids */
  bidStatus: BidStatus | null;
}

export type ReceivedQuotationDetail = ReceivedQuotation & QuotationContents;

export interface QuotationItemInput {
  id?: string;
  name: string;
  quantity: number;
  unit: string | null;
  notes: string | null;
}

export interface QuotationEventInput {
  title: string;
  eventType: EventType;
  eventDate: string;
  location: string;
  guestCount: number | null;
  responseDeadline: string | null;
  description: string | null;
}

export interface CreateQuotationInput extends QuotationEventInput {
  items: QuotationItemInput[];
  vendorIds?: string[];
}

export type UpdateQuotationInput = Partial<QuotationEventInput> & { items?: QuotationItemInput[] };

export interface ListQuotationsParams {
  page: number;
  limit: number;
  search?: string;
  eventType?: EventType;
}
