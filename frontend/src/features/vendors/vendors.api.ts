import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { api, type Paginated } from "@/lib/api";

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

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  phone: string;
  contactName: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface VendorDetails {
  name: string;
  category: VendorCategory;
  phone: string;
  contactName?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface CreateVendorInput extends VendorDetails {
  login: { name: string; email: string; password: string };
}

export type UpdateVendorInput = Partial<VendorDetails> & { isActive?: boolean };

export interface ListVendorsParams {
  page: number;
  limit: number;
  search?: string;
  category?: VendorCategory;
  isActive?: boolean;
}

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
