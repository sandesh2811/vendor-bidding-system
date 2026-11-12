import { z } from "zod";
import { QUOTATION_LIMITS as L } from "@/features/quotations/constants";
import { formatMoney, MONEY_MAX } from "@/lib/format";

/* mirrors SubmitBidDto; the API stays the authority. Prices are kept as strings so "" means "not entered" */
const PRICE = /^\d+(\.\d{1,2})?$/;

export const bidFormSchema = z.object({
  items: z.array(
    z.object({
      quotationItemId: z.string(),
      unitPrice: z
        .string()
        .trim()
        .min(1, "Enter a price (0 if you don't offer this item)")
        .regex(PRICE, "Enter 0 or more, with at most 2 decimals")
        .refine((value) => Number(value) <= MONEY_MAX, `At most ${formatMoney(MONEY_MAX)}`),
    }),
  ),
  notes: z.string().trim().max(L.DESCRIPTION_MAX, `Notes must be at most ${L.DESCRIPTION_MAX} characters`),
  validUntil: z.string(),
});

export type BidFormInput = z.input<typeof bidFormSchema>;
export type BidFormValues = z.output<typeof bidFormSchema>;
