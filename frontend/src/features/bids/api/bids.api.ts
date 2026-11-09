import { queryOptions } from "@tanstack/react-query";
import axios from "axios";
import { api } from "@/lib/api";
import type { Bid, Booking, ComparedBid, SubmitBidInput } from "../types";

export const bidKeys = {
  all: ["bids"] as const,
  mine: (quotationId: string) => [...bidKeys.all, "mine", quotationId] as const,
  forQuotation: (quotationId: string) => [...bidKeys.all, "quotation", quotationId] as const,
};

/* vendor: 404 means "no bid yet", a normal state rather than an error */
export async function getMyBid(quotationId: string): Promise<Bid | null> {
  try {
    return (await api.get<Bid>(`/vendor/quotations/${quotationId}/bid`)).data;
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 404) return null;
    throw e;
  }
}

/* vendor: creates or replaces the single bid; resubmitting the same body is harmless */
export async function submitBid(quotationId: string, input: SubmitBidInput): Promise<Bid> {
  return (await api.put<Bid>(`/vendor/quotations/${quotationId}/bid`, input)).data;
}

export async function listBids(quotationId: string): Promise<ComparedBid[]> {
  return (await api.get<ComparedBid[]>(`/quotations/${quotationId}/bids`)).data;
}

/* admin: rejects the other bids, awards the quotation and returns the new booking */
export async function selectBid(bidId: string): Promise<Booking> {
  return (await api.post<Booking>(`/bids/${bidId}/select`)).data;
}

export const myBidQuery = (quotationId: string) =>
  queryOptions({ queryKey: bidKeys.mine(quotationId), queryFn: () => getMyBid(quotationId) });

export const quotationBidsQuery = (quotationId: string) =>
  queryOptions({ queryKey: bidKeys.forQuotation(quotationId), queryFn: () => listBids(quotationId) });
