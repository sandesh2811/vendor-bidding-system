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

/* where Mero Event pays the vendor; every field is null (and hasQr false) until the vendor adds them */
export interface PaymentDetails {
  vendorId: string;
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  branch: string | null;
  hasQr: boolean;
  updatedAt: string | null;
}

export interface BankAccountInput {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch?: string;
}
