import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Vendor, VendorDetails } from "../types";

/* vendor portal: always the logged-in vendor's own data */
export interface VendorSummary {
  newRequests: number;
  bidsInProgress: number;
  upcomingBookings: number;
}

export const vendorSummaryQuery = queryOptions({
  queryKey: ["vendor-portal", "summary"],
  queryFn: async () => (await api.get<VendorSummary>("/vendor/summary")).data,
});

export const vendorProfileQuery = queryOptions({
  queryKey: ["vendor-portal", "profile"],
  queryFn: async () => (await api.get<Vendor>("/vendor/profile")).data,
});

/* only these fields; the API refuses emails, login, category and notes */
export type VendorProfileInput = Pick<VendorDetails, "name" | "phone" | "contactName" | "address">;

export const updateVendorProfile = async (input: VendorProfileInput) =>
  (await api.patch<Vendor>("/vendor/profile", input)).data;
