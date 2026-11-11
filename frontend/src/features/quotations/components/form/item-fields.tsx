"use client";

import { Trash2Icon } from "lucide-react";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { QUOTATION_LIMITS as L } from "../../constants";
import type { QuotationFormInput } from "../../schemas/quotation-form.schema";

type Values = QuotationFormInput;

/* labels show on phones; from `sm` up, ItemsSection's column headers take over */
const columnLabel = "sm:[&_label]:sr-only";

/* one line item: a card on phones, a table-like row from `sm` up */
export function ItemFields({ index, onRemove, canRemove }: { index: number; onRemove: () => void; canRemove: boolean }) {
  return (
    <li className="relative grid grid-cols-2 gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_6rem_7rem_2.25rem] sm:gap-x-2 sm:rounded-none sm:border-0 sm:p-0">
      <TextField<Values>
        name={`items.${index}.name`}
        label="Item"
        className={`col-span-2 pr-10 sm:col-span-1 sm:pr-0 ${columnLabel}`}
        maxLength={L.TITLE_MAX}
        placeholder="Stage decoration"
      />
      <TextField<Values> name={`items.${index}.quantity`} label="Quantity" className={columnLabel} inputMode="numeric" />
      <TextField<Values>
        name={`items.${index}.unit`}
        label="Unit"
        className={columnLabel}
        maxLength={L.UNIT_MAX}
        placeholder="pcs"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Remove item ${index + 1}`}
        disabled={!canRemove}
        onClick={onRemove}
        className="absolute top-2 right-2 text-destructive hover:bg-destructive/10 hover:text-destructive sm:static"
      >
        <Trash2Icon />
      </Button>
      <TextField<Values>
        name={`items.${index}.notes`}
        label="Notes"
        hideLabel
        className="col-span-2 sm:col-span-3"
        maxLength={L.ITEM_NOTES_MAX}
        placeholder="Notes for the vendor (optional)"
      />
    </li>
  );
}
