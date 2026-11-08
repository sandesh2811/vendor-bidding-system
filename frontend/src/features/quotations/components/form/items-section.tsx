"use client";

import { PlusIcon } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { QUOTATION_LIMITS as L } from "../../constants";
import type { QuotationFormInput } from "../../schemas/quotation-form.schema";
import { blankItem } from "../../utils/quotation-form-mapper";
import { ItemFields } from "./item-fields";

/* the editable item list; saved items keep their ids (itemId) so later bids can refer to them */
export function ItemsSection() {
  const { control, formState } = useFormContext<QuotationFormInput>();
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const full = fields.length >= L.MAX_ITEMS;

  return (
    <SectionCard
      title="Items"
      description="Each line is priced by the vendor. Add quantities and any specifics."
      action={
        <Button type="button" variant="outline" size="sm" disabled={full} onClick={() => append(blankItem())}>
          <PlusIcon data-icon="inline-start" />
          Add item
        </Button>
      }
    >
      <div
        aria-hidden
        className="mb-2 hidden grid-cols-[minmax(0,1fr)_6rem_7rem_2.25rem] gap-x-2 text-xs font-medium text-muted-foreground sm:grid"
      >
        <span>Item</span>
        <span>Quantity</span>
        <span>Unit</span>
      </div>

      <ol className="space-y-3 sm:space-y-4">
        {fields.map((field, index) => (
          <ItemFields key={field.id} index={index} canRemove={fields.length > 1} onRemove={() => remove(index)} />
        ))}
      </ol>

      <FieldError className="mt-3" errors={[formState.errors.items?.root, formState.errors.items]} />
      <p className="mt-3 text-xs text-muted-foreground tabular-nums">
        {fields.length} of {L.MAX_ITEMS} items
      </p>
    </SectionCard>
  );
}
