import type { VendorCategory } from "../constants";
import type { CreateVendorInput, VendorDetails } from "../types";

export const readText = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

/* blank optional fields become null so an edit can clear them (the API skips validation for null) */
export function readVendorDetails(form: FormData): VendorDetails {
  const optional = (key: string) => readText(form, key) || null;
  return {
    name: readText(form, "name"),
    category: readText(form, "category") as VendorCategory,
    phone: readText(form, "phone"),
    contactName: optional("contactName"),
    email: optional("email"),
    address: optional("address"),
    notes: optional("notes"),
  };
}

/* the account holder defaults to the contact person, then the business name */
export function readCreateVendor(form: FormData): CreateVendorInput {
  const details = readVendorDetails(form);
  return {
    ...details,
    login: {
      name: readText(form, "loginName") || details.contactName || details.name,
      email: readText(form, "loginEmail"),
      password: String(form.get("loginPassword") ?? ""),
    },
  };
}
