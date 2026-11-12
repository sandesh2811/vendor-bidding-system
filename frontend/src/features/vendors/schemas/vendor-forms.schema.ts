import type { DefaultValues } from "react-hook-form";
import { z } from "zod";
import { PAYMENT_LIMITS, VENDOR_CATEGORIES, VENDOR_LIMITS as L } from "../constants";
import type { BankAccountInput, CreateVendorInput, Vendor, VendorDetails } from "../types";

/* rules mirror the API's DTOs so most mistakes are caught before a round trip; the API stays the authority */

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

const optionalText = (label: string, max: number) =>
  z.string().trim().max(max, `${label} must be at most ${max} characters`);

const email = (label: string) =>
  z
    .string()
    .trim()
    .max(L.EMAIL_MAX, `${label} must be at most ${L.EMAIL_MAX} characters`)
    .refine((value) => value === "" || z.email().safeParse(value).success, "Enter a valid email address");

/* blank optional fields are sent as null so an edit can clear them */
const orNull = (value: string) => value || null;

export const vendorDetailsSchema = z.object({
  name: requiredText("Business name", L.NAME_MAX),
  category: z.enum(VENDOR_CATEGORIES, { error: "Choose a category" }),
  phone: requiredText("Phone", L.TEXT_MAX),
  contactName: optionalText("Contact person", L.NAME_MAX),
  email: email("Business email"),
  address: optionalText("Address", L.TEXT_MAX),
  notes: optionalText("Notes", L.NOTES_MAX),
});

export type VendorDetailsInput = z.input<typeof vendorDetailsSchema>;
export type VendorDetailsValues = z.output<typeof vendorDetailsSchema>;

export const createVendorSchema = vendorDetailsSchema.extend({
  loginName: optionalText("Account holder", L.NAME_MAX),
  loginEmail: email("Login email").refine((value) => value !== "", "Login email is required"),
  loginPassword: z
    .string()
    .min(L.PASSWORD_MIN, `Use at least ${L.PASSWORD_MIN} characters`)
    .max(L.PASSWORD_MAX, `Use at most ${L.PASSWORD_MAX} characters`),
});

export type CreateVendorFormInput = z.input<typeof createVendorSchema>;
export type CreateVendorFormValues = z.output<typeof createVendorSchema>;

/* category stays unset (placeholder shown) until chosen */
export const vendorDetailsDefaults = (vendor?: Vendor): DefaultValues<VendorDetailsInput> => ({
  name: vendor?.name ?? "",
  category: vendor?.category,
  phone: vendor?.phone ?? "",
  contactName: vendor?.contactName ?? "",
  email: vendor?.email ?? "",
  address: vendor?.address ?? "",
  notes: vendor?.notes ?? "",
});

export const toVendorDetails = (values: VendorDetailsValues): VendorDetails => ({
  name: values.name,
  category: values.category,
  phone: values.phone,
  contactName: orNull(values.contactName),
  email: orNull(values.email),
  address: orNull(values.address),
  notes: orNull(values.notes),
});

/* the account holder defaults to the contact person, then the business name */
export const toCreateVendor = (values: CreateVendorFormValues): CreateVendorInput => ({
  ...toVendorDetails(values),
  login: {
    name: values.loginName || values.contactName || values.name,
    email: values.loginEmail,
    password: values.loginPassword,
  },
});

/* what a vendor may change about itself (UpdateVendorProfileDto) */
export const vendorProfileSchema = vendorDetailsSchema.pick({ name: true, phone: true, contactName: true, address: true });

export type VendorProfileFormInput = z.input<typeof vendorProfileSchema>;
export type VendorProfileFormValues = z.output<typeof vendorProfileSchema>;

/* UpdateBankAccountDto */
export const bankAccountSchema = z.object({
  bankName: requiredText("Bank", L.NAME_MAX),
  accountName: requiredText("Account name", L.NAME_MAX),
  accountNumber: requiredText("Account number", PAYMENT_LIMITS.ACCOUNT_NUMBER_MAX).regex(
    /^[A-Za-z0-9][A-Za-z0-9 -]*$/,
    "Use only letters, digits, spaces and dashes",
  ),
  branch: optionalText("Branch", L.NAME_MAX),
});

export type BankAccountFormInput = z.input<typeof bankAccountSchema>;
export type BankAccountFormValues = z.output<typeof bankAccountSchema>;

export const toBankAccount = ({ branch, ...bank }: BankAccountFormValues): BankAccountInput => ({
  ...bank,
  branch: branch || undefined,
});
