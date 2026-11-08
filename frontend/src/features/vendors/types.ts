import type { VendorCategory } from "./constants";

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
