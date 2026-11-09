"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangleIcon, CheckIcon, InboxIcon, SendIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { EmptyState } from "@/components/layout/empty-state";
import { QueryBoundary } from "@/components/layout/query-boundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { QuotationDetail, QuotationRecipient } from "@/features/quotations/types";
import { CATEGORY_LABELS } from "@/features/vendors/constants";
import { formatDay } from "@/lib/dates";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { quotationBidsQuery } from "../../api/bids.api";
import { BID_STATUS_LABELS } from "../../constants";
import type { ComparedBid } from "../../types";
import { compareBids, isComplete } from "../../utils/compare-bids";
import { SelectBidDialog } from "./select-bid-dialog";

const sticky = "sticky left-0 z-10 bg-card";

/* items down the side, one column per vendor it was sent to (in send order); highlights are hints, the admin decides */
export function BidComparison({ quotation }: { quotation: QuotationDetail }) {
  const query = useQuery(quotationBidsQuery(quotation.id));

  if (!quotation.recipients.length)
    return (
      <Card>
        <EmptyState
          icon={SendIcon}
          title="Not sent yet"
          description="Send this quotation to vendors to collect bids."
          className="py-12"
        />
      </Card>
    );

  return (
    <QueryBoundary query={query} errorTitle="Couldn't load bids" fallback={<ComparisonSkeleton />}>
      {(bids) =>
        bids.length ? (
          <div className="flex flex-col gap-6">
            <BidSummary recipients={quotation.recipients} bids={bids} />
            <ComparisonTable quotation={quotation} bids={bids} />
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={InboxIcon}
              title="Waiting for bids"
              description={`Sent to ${quotation.recipients.length} vendor${quotation.recipients.length === 1 ? "" : "s"}. Bids show up here as they arrive.`}
              className="py-12"
            />
          </Card>
        )
      }
    </QueryBoundary>
  );
}

/* three facts the admin decides on: response rate, the cheapest bid that covers everything, and the spread */
function BidSummary({ recipients, bids }: { recipients: QuotationRecipient[]; bids: ComparedBid[] }) {
  const { cheapestTotal } = compareBids(bids);
  const cheapestNames = bids
    .filter((bid) => isComplete(bid) && Number(bid.totalAmount) === cheapestTotal)
    .map((bid) => bid.vendor.name)
    .join(", ");
  const totals = bids.map((bid) => Number(bid.totalAmount));
  const low = Math.min(...totals);
  const high = Math.max(...totals);
  const declined = recipients.filter((recipient) => recipient.declinedAt).length;

  const cards = [
    {
      label: "Bids received",
      value: `${bids.length} of ${recipients.length}`,
      hint: declined ? `${declined} declined` : "Vendors this was sent to",
    },
    {
      label: "Lowest complete bid",
      value: cheapestTotal === null ? "None yet" : formatMoney(cheapestTotal),
      hint: cheapestTotal === null ? "No bid prices every item" : cheapestNames,
    },
    {
      label: "Price range",
      value: bids.length > 1 ? formatMoney(high - low) : "One bid",
      hint: bids.length > 1 ? `${formatMoney(low)} to ${formatMoney(high)}` : formatMoney(low),
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="gap-1 py-4">
          <CardHeader className="px-5">
            <CardDescription>{card.label}</CardDescription>
            <CardTitle className="text-xl tabular-nums">{card.value}</CardTitle>
            <p className="truncate text-xs text-muted-foreground">{card.hint}</p>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

function ComparisonTable({ quotation, bids }: { quotation: QuotationDetail; bids: ComparedBid[] }) {
  const [selecting, setSelecting] = useState<ComparedBid | null>(null);
  const hints = compareBids(bids);
  const byVendor = new Map(bids.map((bid) => [bid.vendorId, bid]));
  /* recipients arrive newest first */
  const columns = quotation.recipients
    .toReversed()
    .map((recipient) => ({ recipient, bid: byVendor.get(recipient.vendorId) }));
  const selectable = quotation.status === "open" || quotation.status === "closed";

  /* the winning column is tinted, rejected ones fade back */
  const columnTone = (bid?: ComparedBid) =>
    cn(bid?.status === "selected" && "bg-success/5", bid?.status === "rejected" && "opacity-60");

  const noBid = (recipient: QuotationRecipient) => (recipient.declinedAt ? "Declined" : "No bid yet");

  /* one footer row: a label, then a cell per vendor column */
  const footerRow = (label: string, render: (bid: ComparedBid) => ReactNode) => (
    <TableRow className="hover:bg-transparent">
      <TableHead className={cn(sticky, "pl-4 text-xs text-muted-foreground")}>{label}</TableHead>
      {columns.map(({ recipient, bid }) => (
        <TableCell key={recipient.id} className={cn("align-top whitespace-normal", columnTone(bid))}>
          {bid ? render(bid) : <span className="text-muted-foreground">{noBid(recipient)}</span>}
        </TableCell>
      ))}
    </TableRow>
  );

  return (
    <Card className="py-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b px-4 py-3">
        <h3 className="text-sm font-medium">Compare by item</h3>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <CheckIcon className="size-3.5 text-success" aria-hidden />
          Lowest price per item. Highlights are hints; you make the choice.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={cn(sticky, "min-w-36 pl-4 sm:min-w-52")}>Item</TableHead>
            {columns.map(({ recipient, bid }) => (
              <TableHead key={recipient.id} className={cn("min-w-44 py-3 align-top", columnTone(bid))}>
                <div className="truncate text-sm font-medium text-foreground">{recipient.vendor.name}</div>
                <div className="mt-1">
                  {bid ? (
                    <Badge
                      variant="outline"
                      className={cn("font-normal", bid.status === "selected" && "border-success/40 text-success")}
                    >
                      {BID_STATUS_LABELS[bid.status]}
                    </Badge>
                  ) : (
                    <span className="text-xs font-normal">{noBid(recipient)}</span>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotation.items.map((item) => (
            <TableRow key={item.id} className="hover:bg-transparent">
              <TableCell className={cn(sticky, "py-3 pl-4 align-top whitespace-normal")}>
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  Qty {item.quantity.toLocaleString()}
                  {item.unit && ` ${item.unit}`}
                </div>
              </TableCell>
              {columns.map(({ recipient, bid }) => {
                const line = bid?.items.find((candidate) => candidate.quotationItemId === item.id);
                const tone = cn("py-3 align-top", columnTone(bid));
                if (!line)
                  return (
                    <TableCell key={recipient.id} className={cn(tone, "text-muted-foreground")}>
                      {bid ? "Not quoted" : ""}
                    </TableCell>
                  );
                if (Number(line.unitPrice) === 0)
                  return (
                    <TableCell key={recipient.id} className={tone}>
                      <span className="inline-flex items-center gap-1 text-warning">
                        <AlertTriangleIcon className="size-3.5" aria-hidden />
                        Not offered
                      </span>
                    </TableCell>
                  );
                const cheapest = hints.isCheapestItem(item.id, line.unitPrice);
                return (
                  <TableCell key={recipient.id} className={cn(tone, "tabular-nums")}>
                    <div className={cn("inline-flex items-center gap-1 font-medium", cheapest && "text-success")}>
                      {formatMoney(line.lineTotal)}
                      {cheapest && <CheckIcon className="size-3.5" aria-label="Lowest price for this item" />}
                    </div>
                    <div className="text-xs text-muted-foreground">{formatMoney(line.unitPrice)} each</div>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter className="bg-transparent">
          {footerRow("Total", (bid) => (
            <div className="flex flex-col items-start gap-1.5">
              <span className="text-base font-semibold tabular-nums">{formatMoney(bid.totalAmount)}</span>
              {hints.isCheapestTotal(bid) && (
                <Badge variant="outline" className="border-success/40 text-success">
                  Lowest complete
                </Badge>
              )}
              {!isComplete(bid) && (
                <Badge variant="outline" className="border-warning/40 text-warning">
                  Incomplete
                </Badge>
              )}
            </div>
          ))}
          {footerRow("Category", (bid) => CATEGORY_LABELS[bid.vendor.category])}
          {footerRow("Valid until", (bid) => (bid.validUntil ? formatDay(bid.validUntil) : "Not set"))}
          {footerRow("Updated", (bid) => formatDate(bid.updatedAt))}
          {footerRow("Notes", (bid) => (
            <span className="text-xs text-muted-foreground">{bid.notes ?? "None"}</span>
          ))}
          {selectable &&
            footerRow("", (bid) => (
              <Button
                size="sm"
                variant={hints.isCheapestTotal(bid) ? "default" : "outline"}
                className="w-full"
                onClick={() => setSelecting(bid)}
              >
                Select this bid
              </Button>
            ))}
        </TableFooter>
      </Table>
      <SelectBidDialog quotationId={quotation.id} bid={selecting} onOpenChange={(open) => !open && setSelecting(null)} />
    </Card>
  );
}

function ComparisonSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
