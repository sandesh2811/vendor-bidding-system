import { queryOptions } from "@tanstack/react-query";
import { api, apiUrl } from "@/lib/api";
import type { BankAccountInput, PaymentDetails } from "../types";
import { vendorKeys } from "./vendors.api";

export const paymentDetailsKeys = {
  own: ["vendor-portal", "payment-details"] as const,
  vendor: (vendorId: string) => [...vendorKeys.all, vendorId, "payment-details"] as const,
};

/* the QR's URL changes with updatedAt, so a replaced image is never served from the browser cache */
const versioned = (path: string, details: PaymentDetails) =>
  apiUrl(`${path}?v=${encodeURIComponent(details.updatedAt ?? "")}`);

/* vendor portal: the logged-in vendor's own details, which it maintains */
export const ownPaymentDetailsQuery = queryOptions({
  queryKey: paymentDetailsKeys.own,
  queryFn: async () => (await api.get<PaymentDetails>("/vendor/payment-details")).data,
});

export const updateBankAccount = async (input: BankAccountInput) =>
  (await api.put<PaymentDetails>("/vendor/payment-details/bank", input)).data;

export const clearBankAccount = async () => (await api.delete<PaymentDetails>("/vendor/payment-details/bank")).data;

export async function uploadPaymentQr(file: File): Promise<PaymentDetails> {
  const body = new FormData();
  body.append("qr", file);
  return (await api.put<PaymentDetails>("/vendor/payment-details/qr", body)).data;
}

export const removePaymentQr = async () => (await api.delete<PaymentDetails>("/vendor/payment-details/qr")).data;

export const ownQrUrl = (details: PaymentDetails) => versioned("/vendor/payment-details/qr", details);

/* admin: any vendor's details, read only */
export const vendorPaymentDetailsQuery = (vendorId: string) =>
  queryOptions({
    queryKey: paymentDetailsKeys.vendor(vendorId),
    queryFn: async () => (await api.get<PaymentDetails>(`/vendors/${vendorId}/payment-details`)).data,
  });

export const vendorQrUrl = (details: PaymentDetails) =>
  versioned(`/vendors/${details.vendorId}/payment-details/qr`, details);
