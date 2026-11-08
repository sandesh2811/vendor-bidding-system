import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { api, apiUrl, type Paginated } from "@/lib/api";
import type { QuotationPhoto, ReceivedQuotation, ReceivedQuotationDetail } from "../types";

/* vendor portal endpoints: the API scopes every read to the logged-in vendor */
export const receivedKeys = {
  all: ["received-quotations"] as const,
  list: (params: { page: number; limit: number }) => [...receivedKeys.all, "list", params] as const,
  detail: (id: string) => [...receivedKeys.all, "detail", id] as const,
};

export async function listReceived(params: { page: number; limit: number }): Promise<Paginated<ReceivedQuotation>> {
  return (await api.get<Paginated<ReceivedQuotation>>("/vendor/quotations", { params })).data;
}

export async function getReceived(id: string): Promise<ReceivedQuotationDetail> {
  return (await api.get<ReceivedQuotationDetail>(`/vendor/quotations/${id}`)).data;
}

export const receivedPhotoUrl = (photo: QuotationPhoto) =>
  apiUrl(`/vendor/quotations/${photo.quotationId}/photos/${photo.id}`);

export const receivedQuotationsQuery = (params: { page: number; limit: number }) =>
  queryOptions({
    queryKey: receivedKeys.list(params),
    queryFn: () => listReceived(params),
    placeholderData: keepPreviousData,
  });

export const receivedQuotationQuery = (id: string) =>
  queryOptions({ queryKey: receivedKeys.detail(id), queryFn: () => getReceived(id) });
