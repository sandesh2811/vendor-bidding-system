import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { api, apiUrl, type Paginated } from "@/lib/api";
import type {
  CreateQuotationInput,
  ListQuotationsParams,
  Quotation,
  QuotationDetail,
  QuotationPhoto,
  UpdateQuotationInput,
} from "../types";

/* admin endpoints; the vendor portal's live in received-quotations.api.ts */
export const quotationKeys = {
  all: ["quotations"] as const,
  lists: () => [...quotationKeys.all, "list"] as const,
  list: (params: ListQuotationsParams) => [...quotationKeys.lists(), params] as const,
  detail: (id: string) => [...quotationKeys.all, "detail", id] as const,
};

export async function listQuotations(params: ListQuotationsParams): Promise<Paginated<Quotation>> {
  return (await api.get<Paginated<Quotation>>("/quotations", { params })).data;
}

export async function getQuotation(id: string): Promise<QuotationDetail> {
  return (await api.get<QuotationDetail>(`/quotations/${id}`)).data;
}

/* idempotent on title + event date + location: a repeat returns the existing quotation */
export async function createQuotation(input: CreateQuotationInput): Promise<QuotationDetail> {
  return (await api.post<QuotationDetail>("/quotations", input)).data;
}

export async function updateQuotation(id: string, input: UpdateQuotationInput): Promise<QuotationDetail> {
  return (await api.patch<QuotationDetail>(`/quotations/${id}`, input)).data;
}

/* idempotent: vendors who already have the quotation are skipped */
export async function addRecipients(id: string, vendorIds: string[]): Promise<QuotationDetail> {
  return (await api.post<QuotationDetail>(`/quotations/${id}/recipients`, { vendorIds })).data;
}

export async function closeQuotation(id: string): Promise<QuotationDetail> {
  return (await api.post<QuotationDetail>(`/quotations/${id}/close`)).data;
}

/* also rejects every submitted bid */
export async function cancelQuotation(id: string): Promise<QuotationDetail> {
  return (await api.post<QuotationDetail>(`/quotations/${id}/cancel`)).data;
}

/* idempotent per image: the same file uploaded twice is stored once */
export async function uploadPhotos(id: string, files: File[]): Promise<QuotationPhoto[]> {
  const body = new FormData();
  for (const file of files) body.append("photos", file);
  return (await api.post<QuotationPhoto[]>(`/quotations/${id}/photos`, body)).data;
}

export async function removePhoto(id: string, photoId: string): Promise<void> {
  await api.delete(`/quotations/${id}/photos/${photoId}`);
}

export const quotationPhotoUrl = (photo: QuotationPhoto) =>
  apiUrl(`/quotations/${photo.quotationId}/photos/${photo.id}`);

export const quotationsQuery = (params: ListQuotationsParams) =>
  queryOptions({
    queryKey: quotationKeys.list(params),
    queryFn: () => listQuotations(params),
    placeholderData: keepPreviousData,
  });

export const quotationQuery = (id: string) =>
  queryOptions({ queryKey: quotationKeys.detail(id), queryFn: () => getQuotation(id) });
