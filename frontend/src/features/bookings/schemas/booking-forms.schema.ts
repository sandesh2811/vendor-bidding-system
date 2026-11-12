import { z } from "zod";
import { businessToday } from "@/lib/dates";
import { formatMoney, MONEY_MAX } from "@/lib/format";
import { BOOKING_LIMITS as L, PAYMENT_METHODS } from "../constants";

/* mirror CreatePaymentDto / UpdateBookingDto; the API stays the authority. Amounts are strings so "" means "not entered" */
const AMOUNT = /^\d+(\.\d{1,2})?$/;

const amount = z
  .string()
  .trim()
  .regex(AMOUNT, "Enter an amount with at most 2 decimals")
  .refine((value) => Number(value) <= MONEY_MAX, `At most ${formatMoney(MONEY_MAX)}`);

export const paymentFormSchema = (pending: number) =>
  z.object({
    amount: amount
      .refine((value) => Number(value) > 0, "Enter more than 0")
      .refine((value) => Number(value) <= pending, "Can't be more than the pending amount"),
    paidAt: z
      .string()
      .min(1, "Pick the date it was paid")
      .refine((value) => value <= businessToday(), "Can't be in the future"),
    method: z.enum(PAYMENT_METHODS, { error: "Pick a method" }),
    reference: z.string().trim().max(L.REFERENCE_MAX, `At most ${L.REFERENCE_MAX} characters`),
    note: z.string().trim().max(L.NOTE_MAX, `At most ${L.NOTE_MAX} characters`),
  });

export type PaymentFormInput = z.input<ReturnType<typeof paymentFormSchema>>;
export type PaymentFormValues = z.output<ReturnType<typeof paymentFormSchema>>;

export const editAmountSchema = (paid: number) =>
  z.object({
    amount: amount
      .refine((value) => Number(value) > 0, "Enter more than 0")
      .refine((value) => Number(value) >= paid, "Can't be less than what's already paid"),
    notes: z.string().trim().min(1, "Give a reason for the change").max(L.NOTE_MAX, `At most ${L.NOTE_MAX} characters`),
  });

export type EditAmountInput = z.input<ReturnType<typeof editAmountSchema>>;
export type EditAmountValues = z.output<ReturnType<typeof editAmountSchema>>;
