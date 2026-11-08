import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { api, type Paginated } from "@/lib/api";
import type { CreateVendorInput, ListVendorsParams, UpdateVendorInput, Vendor } from "../types";

export const vendorKeys = {
  all: ["vendors"] as const,
  list: (params: ListVendorsParams) => [...vendorKeys.all, "list", params] as const,
};

export async function listVendors(params: ListVendorsParams): Promise<Paginated<Vendor>> {
  return (await api.get<Paginated<Vendor>>("/vendors", { params })).data;
}

export async function createVendor(input: CreateVendorInput): Promise<Vendor> {
  return (await api.post<Vendor>("/vendors", input)).data;
}

export async function updateVendor(id: string, input: UpdateVendorInput): Promise<Vendor> {
  return (await api.patch<Vendor>(`/vendors/${id}`, input)).data;
}

/* keepPreviousData holds the current page on screen while the next page or filter loads */
export const vendorsQuery = (params: ListVendorsParams) =>
  queryOptions({
    queryKey: vendorKeys.list(params),
    queryFn: () => listVendors(params),
    placeholderData: keepPreviousData,
  });

/* MAX_LIMIT in the backend: the picker offers up to this many active vendors, filtered client-side */
const PICKER_LIMIT = 100;

export const activeVendorsQuery = () =>
  queryOptions({
    queryKey: vendorKeys.list({ page: 1, limit: PICKER_LIMIT, isActive: true }),
    queryFn: () => listVendors({ page: 1, limit: PICKER_LIMIT, isActive: true }),
    select: (page) => page.items,
  });
