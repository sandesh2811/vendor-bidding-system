import { z } from "zod";
import { EVENT_TYPES, QUOTATION_LIMITS as L } from "../constants";

/* rules mirror the API's DTOs so most mistakes are caught before a round trip; the API stays the authority */

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

const optionalText = (label: string, max: number) =>
  z.string().trim().max(max, `${label} must be at most ${max} characters`);

const isWholeNumberIn = (value: string, max: number) => /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= max;

/* number inputs are kept as strings in the form, so "" can mean "not given" */
const wholeNumber = (label: string, max: number) =>
  z.string().trim().refine((value) => isWholeNumberIn(value, max), `${label} must be a whole number from 1 to ${max}`);

const optionalWholeNumber = (label: string, max: number) =>
  z
    .string()
    .trim()
    .refine((value) => value === "" || isWholeNumberIn(value, max), `${label} must be a whole number from 1 to ${max}`);

export const quotationItemSchema = z.object({
  /* set for items already saved; RHF's field array reserves `id` for its own row keys */
  itemId: z.string().optional(),
  name: requiredText("Item name", L.TITLE_MAX),
  quantity: wholeNumber("Quantity", L.MAX_QUANTITY),
  unit: optionalText("Unit", L.UNIT_MAX),
  notes: optionalText("Notes", L.ITEM_NOTES_MAX),
});

export const quotationFormSchema = z
  .object({
    title: requiredText("Title", L.TITLE_MAX),
    eventType: z.enum(EVENT_TYPES, { error: "Choose the event type" }),
    eventDate: z.string().min(1, "Pick the event date"),
    location: requiredText("Location", L.TEXT_MAX),
    guestCount: optionalWholeNumber("Guest count", L.MAX_GUESTS),
    responseDeadline: z.string(),
    description: optionalText("Description", L.DESCRIPTION_MAX),
    items: z
      .array(quotationItemSchema)
      .min(1, "Add at least one item")
      .max(L.MAX_ITEMS, `A quotation can have at most ${L.MAX_ITEMS} items`),
  })
  /* the API enforces the same rule with a DB constraint */
  .refine((form) => !form.responseDeadline || !form.eventDate || form.responseDeadline <= form.eventDate, {
    path: ["responseDeadline"],
    message: "Must be on or before the event date",
  });

export type QuotationFormInput = z.input<typeof quotationFormSchema>;
export type QuotationFormValues = z.output<typeof quotationFormSchema>;
export type QuotationItemFormValues = z.input<typeof quotationItemSchema>;
