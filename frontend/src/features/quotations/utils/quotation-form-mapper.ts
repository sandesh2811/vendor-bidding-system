import type { DefaultValues } from "react-hook-form";
import type { QuotationFormInput, QuotationFormValues, QuotationItemFormValues } from "../schemas/quotation-form.schema";
import type {
  CreateQuotationInput,
  QuotationDetail,
  QuotationEventInput,
  QuotationItemInput,
  UpdateQuotationInput,
} from "../types";

export const blankItem = (): QuotationItemFormValues => ({ name: "", quantity: "1", unit: "", notes: "" });

/* eventType is left unset so the select shows its placeholder */
export const emptyQuotationForm = (): DefaultValues<QuotationFormInput> => ({
  title: "",
  eventDate: "",
  location: "",
  guestCount: "",
  responseDeadline: "",
  description: "",
  items: [blankItem()],
});

/* a saved quotation as form values (numbers and nulls become strings) */
export const toFormValues = (quotation: QuotationDetail): QuotationFormInput => ({
  title: quotation.title,
  eventType: quotation.eventType,
  eventDate: quotation.eventDate,
  location: quotation.location,
  guestCount: quotation.guestCount?.toString() ?? "",
  responseDeadline: quotation.responseDeadline ?? "",
  description: quotation.description ?? "",
  items: quotation.items.map((item) => ({
    itemId: item.id,
    name: item.name,
    quantity: String(item.quantity),
    unit: item.unit ?? "",
    notes: item.notes ?? "",
  })),
});

/* blank optional fields become null so an edit can clear them */
const toEventInput = (form: QuotationFormValues): QuotationEventInput => ({
  title: form.title,
  eventType: form.eventType,
  eventDate: form.eventDate,
  location: form.location,
  guestCount: form.guestCount ? Number(form.guestCount) : null,
  responseDeadline: form.responseDeadline || null,
  description: form.description || null,
});

const toItemsInput = (form: QuotationFormValues): QuotationItemInput[] =>
  form.items.map(({ itemId, name, quantity, unit, notes }) => ({
    ...(itemId && { id: itemId }),
    name,
    quantity: Number(quantity),
    unit: unit || null,
    notes: notes || null,
  }));

export const toCreateInput = (form: QuotationFormValues): CreateQuotationInput => ({
  ...toEventInput(form),
  items: toItemsInput(form),
});

/* only what changed: an untouched past event date isn't re-sent (and rejected as past) on an unrelated edit */
export function toUpdateInput(form: QuotationFormValues, saved: QuotationDetail): UpdateQuotationInput {
  const next = toEventInput(form);
  const changes: UpdateQuotationInput = {};

  for (const key of Object.keys(next) as (keyof QuotationEventInput)[]) {
    if (next[key] !== saved[key]) Object.assign(changes, { [key]: next[key] });
  }

  const items = toItemsInput(form);
  const savedItems = saved.items.map(({ id, name, quantity, unit, notes }) => ({ id, name, quantity, unit, notes }));
  if (JSON.stringify(items) !== JSON.stringify(savedItems)) changes.items = items;

  return changes;
}
