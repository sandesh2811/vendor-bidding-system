"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { DatePicker } from "@/components/form/date-picker";
import { FormField } from "@/components/form/form-field";
import { PendingButton } from "@/components/form/pending-button";
import { TextField } from "@/components/form/text-field";
import { QueryBoundary } from "@/components/layout/query-boundary";
import { SectionCard } from "@/components/layout/section-card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { QuotationItem, ReceivedQuotationDetail } from "@/features/quotations/types";
import { businessToday, formatDay } from "@/lib/dates";
import { formatDate, formatMoney } from "@/lib/format";
import { myBidQuery } from "../../api/bids.api";
import { useSubmitBid } from "../../hooks/use-bid-mutations";
import { type BidFormInput, type BidFormValues, bidFormSchema } from "../../schemas/bid-form.schema";
import type { Bid } from "../../types";

/* the vendor's one bid on this request: editable while open and undecided, read-only otherwise */
export function BidFormCard({ quotation }: { quotation: ReceivedQuotationDetail }) {
  const query = useQuery(myBidQuery(quotation.id));

  return (
    <QueryBoundary query={query} errorTitle="Couldn't load your bid" fallback={<Skeleton className="h-64 w-full" />}>
      {(bid) =>
        quotation.status === "open" && (!bid || bid.status === "submitted") ? (
          /* remount on save so the form's defaults are the saved bid */
          <BidForm key={bid?.updatedAt ?? "new"} quotation={quotation} bid={bid} />
        ) : (
          <ReadOnlyBid quotation={quotation} bid={bid} />
        )
      }
    </QueryBoundary>
  );
}

function BidForm({ quotation, bid }: { quotation: ReceivedQuotationDetail; bid: Bid | null }) {
  const mutation = useSubmitBid(quotation.id);
  const form = useForm<BidFormInput, unknown, BidFormValues>({
    resolver: zodResolver(bidFormSchema),
    mode: "onTouched",
    defaultValues: {
      items: quotation.items.map((item) => ({
        quotationItemId: item.id,
        unitPrice: bid?.items.find((line) => line.quotationItemId === item.id)?.unitPrice ?? "",
      })),
      notes: bid?.notes ?? "",
      validUntil: bid?.validUntil ?? "",
    },
  });
  const prices = useWatch({ control: form.control, name: "items" });
  /* display only: the server computes the real totals */
  const lineTotal = (index: number) => Number(prices[index]?.unitPrice || 0) * quotation.items[index].quantity;
  const total = quotation.items.reduce((sum, _, index) => sum + lineTotal(index), 0);

  function onSubmit(values: BidFormValues) {
    mutation.mutate(
      {
        items: values.items.map((item) => ({ quotationItemId: item.quotationItemId, unitPrice: Number(item.unitPrice) })),
        notes: values.notes || null,
        validUntil: values.validUntil || null,
      },
      { onSuccess: () => toast.success(bid ? "Bid updated" : "Bid submitted") },
    );
  }

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <SectionCard
          title="Your bid"
          description={
            bid ? `Submitted · last updated ${formatDate(bid.updatedAt)}` : "Enter a unit price for every item. Use 0 for items you don't offer."
          }
          contentClassName="flex flex-col gap-6 px-0"
        >
          <ItemsTable items={quotation.items} total={total} lineTotal={lineTotal}>
            {(index) => (
              <FormField<BidFormInput, `items.${number}.unitPrice`>
                name={`items.${index}.unitPrice`}
                label={`Unit price for ${quotation.items[index].name}`}
                hideLabel
              >
                {({ field, id, invalid }) => (
                  <Input {...field} id={id} aria-invalid={invalid} inputMode="decimal" placeholder="0.00" className="ml-auto w-32 text-right" />
                )}
              </FormField>
            )}
          </ItemsTable>
          <div className="grid gap-5 px-6 sm:grid-cols-2">
            <TextField<BidFormInput>
              name="notes"
              label="Notes"
              optional
              multiline
              rows={3}
              placeholder="What's included, brands, delivery and setup time"
              className="sm:col-span-2"
            />
            <FormField<BidFormInput, "validUntil"> name="validUntil" label="Valid until" optional>
              {({ field, id, invalid }) => (
                <DatePicker id={id} value={field.value} onChange={field.onChange} min={businessToday()} placeholder="No expiry" invalid={invalid} />
              )}
            </FormField>
          </div>
          <div className="flex justify-end px-6">
            <PendingButton type="submit" pending={mutation.isPending}>
              {bid ? "Update bid" : "Submit bid"}
            </PendingButton>
          </div>
        </SectionCard>
      </form>
    </FormProvider>
  );
}

const READ_ONLY_REASON = {
  selected: "Your bid was selected.",
  rejected: "Another bid was selected, or the request was cancelled.",
  closed: "Bidding is closed for this request.",
  awarded: "Bidding is closed for this request.",
  cancelled: "This request was cancelled.",
} as const;

function ReadOnlyBid({ quotation, bid }: { quotation: ReceivedQuotationDetail; bid: Bid | null }) {
  const reason =
    bid && bid.status !== "submitted"
      ? READ_ONLY_REASON[bid.status]
      : READ_ONLY_REASON[quotation.status as "closed" | "awarded" | "cancelled"];

  if (!bid)
    return (
      <SectionCard title="Your bid" description={reason}>
        <p className="text-sm text-muted-foreground">No bid submitted.</p>
      </SectionCard>
    );

  const line = (index: number) => bid.items.find((candidate) => candidate.quotationItemId === quotation.items[index].id);

  return (
    <SectionCard title="Your bid" description={`${reason} Last updated ${formatDate(bid.updatedAt)}.`} contentClassName="flex flex-col gap-4 px-0">
      <ItemsTable items={quotation.items} total={Number(bid.totalAmount)} lineTotal={(index) => Number(line(index)?.lineTotal ?? 0)}>
        {(index) => <span className="tabular-nums">{formatMoney(line(index)?.unitPrice ?? 0)}</span>}
      </ItemsTable>
      {(bid.notes || bid.validUntil) && (
        <dl className="grid gap-3 px-6 text-sm sm:grid-cols-2">
          {bid.notes && (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Notes</dt>
              <dd className="whitespace-pre-line">{bid.notes}</dd>
            </div>
          )}
          {bid.validUntil && (
            <div>
              <dt className="text-muted-foreground">Valid until</dt>
              <dd>{formatDay(bid.validUntil)}</dd>
            </div>
          )}
        </dl>
      )}
    </SectionCard>
  );
}

/* items with a price cell per row (input or text), line totals and the overall total */
function ItemsTable({
  items,
  total,
  lineTotal,
  children,
}: {
  items: QuotationItem[];
  total: number;
  lineTotal: (index: number) => number;
  children: (index: number) => ReactNode;
}) {
  return (
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-6 text-xs text-muted-foreground">Item</TableHead>
          <TableHead className="text-right text-xs text-muted-foreground">Qty</TableHead>
          <TableHead className="text-right text-xs text-muted-foreground">Unit price</TableHead>
          <TableHead className="pr-6 text-right text-xs text-muted-foreground">Line total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, index) => (
          <TableRow key={item.id} className="hover:bg-transparent">
            <TableCell className="pl-6 align-top whitespace-normal">
              <div className="font-medium">{item.name}</div>
              {item.notes && <div className="mt-0.5 text-xs text-muted-foreground">{item.notes}</div>}
            </TableCell>
            <TableCell className="text-right align-top tabular-nums">
              {item.quantity.toLocaleString()}
              {item.unit && <span className="ml-1 text-muted-foreground">{item.unit}</span>}
            </TableCell>
            <TableCell className="text-right align-top">{children(index)}</TableCell>
            <TableCell className="pr-6 text-right align-top tabular-nums">{formatMoney(lineTotal(index))}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter className="bg-transparent">
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={3} className="pl-6 font-medium">
            Total
          </TableCell>
          <TableCell className="pr-6 text-right font-semibold tabular-nums">{formatMoney(total)}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
