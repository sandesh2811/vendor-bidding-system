"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangleIcon, CheckIcon, SendIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import { EmptyState } from "@/components/layout/empty-state";
import { QueryBoundary } from "@/components/layout/query-boundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { QuotationDetail } from "@/features/quotations/types";
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
      <EmptyState
        icon={SendIcon}
        title="No bids yet"
        description="Send this quotation to vendors to collect bids."
        className="py-10"
      />
    );

  return (
    <QueryBoundary query={query} errorTitle="Couldn't load bids" fallback={<Skeleton className="h-64 w-full" />}>
      {(bids) => <ComparisonTable quotation={quotation} bids={bids} />}
    </QueryBoundary>
  );
}

function ComparisonTable({ quotation, bids }: { quotation: QuotationDetail; bids: ComparedBid[] }) {
  const [selecting, setSelecting] = useState<ComparedBid | null>(null);
  const hints = compareBids(bids);
  const byVendor = new Map(bids.map((bid) => [bid.vendorId, bid]));
  /* recipients arrive newest first */
  const columns = quotation.recipients.toReversed().map((recipient) => ({ recipient, bid: byVendor.get(recipient.vendorId) }));
  const selectable = quotation.status === "open" || quotation.status === "closed";

  /* one footer row: a label, then a cell per vendor column */
  const footerRow = (label: string, render: (bid: ComparedBid) => ReactNode) => (
    <TableRow className="hover:bg-transparent">
      <TableHead className={cn(sticky, "pl-4 text-xs text-muted-foreground")}>{label}</TableHead>
      {columns.map(({ recipient, bid }) => (
        <TableCell key={recipient.id} className="align-top whitespace-normal">
          {bid ? render(bid) : <span className="text-muted-foreground">—</span>}
        </TableCell>
      ))}
    </TableRow>
  );

  return (
    <Card className="py-0">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className={cn(sticky, "min-w-48 bg-muted pl-4 text-xs text-muted-foreground")}>Item</TableHead>
            {columns.map(({ recipient, bid }) => (
              <TableHead key={recipient.id} className="min-w-44 py-2 align-top">
                <div className="font-medium text-foreground">{recipient.vendor.name}</div>
                <div className="text-xs font-normal text-muted-foreground">
                  {bid ? BID_STATUS_LABELS[bid.status] : "No bid yet"}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotation.items.map((item) => (
            <TableRow key={item.id} className="hover:bg-transparent">
              <TableCell className={cn(sticky, "pl-4 align-top whitespace-normal")}>
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  Qty {item.quantity.toLocaleString()}
                  {item.unit && ` ${item.unit}`}
                </div>
              </TableCell>
              {columns.map(({ recipient, bid }) => {
                const line = bid?.items.find((candidate) => candidate.quotationItemId === item.id);
                if (!line)
                  return (
                    <TableCell key={recipient.id} className="align-top text-muted-foreground">
                      {bid ? "—" : "No bid yet"}
                    </TableCell>
                  );
                if (Number(line.unitPrice) === 0)
                  return (
                    <TableCell key={recipient.id} className="align-top">
                      <span className="inline-flex items-center gap-1 text-amber-600">
                        <AlertTriangleIcon className="size-3.5" aria-hidden />
                        Not offered
                      </span>
                    </TableCell>
                  );
                const cheapest = hints.isCheapestItem(item.id, line.unitPrice);
                return (
                  <TableCell key={recipient.id} className="align-top tabular-nums">
                    <div className="text-xs text-muted-foreground">{formatMoney(line.unitPrice)} each</div>
                    <div className={cn("inline-flex items-center gap-1 font-medium", cheapest && "text-success")}>
                      {formatMoney(line.lineTotal)}
                      {cheapest && <CheckIcon className="size-3.5" aria-label="Lowest price for this item" />}
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter className="bg-transparent">
          {footerRow("Total", (bid) => (
            <div className="flex flex-col items-start gap-1">
              <span className="font-semibold tabular-nums">{formatMoney(bid.totalAmount)}</span>
              {hints.isCheapestTotal(bid) && <Badge className="bg-success text-white">Lowest complete</Badge>}
              {!isComplete(bid) && (
                <Badge variant="outline" className="border-amber-500 text-amber-600">
                  Incomplete
                </Badge>
              )}
            </div>
          ))}
          {footerRow("Category", (bid) => CATEGORY_LABELS[bid.vendor.category])}
          {footerRow("Valid until", (bid) => (bid.validUntil ? formatDay(bid.validUntil) : "—"))}
          {footerRow("Updated", (bid) => formatDate(bid.updatedAt))}
          {footerRow("Notes", (bid) => (
            <span className="text-xs text-muted-foreground">{bid.notes ?? "—"}</span>
          ))}
          {selectable &&
            footerRow("", (bid) => (
              <Button size="sm" onClick={() => setSelecting(bid)}>
                Select
              </Button>
            ))}
        </TableFooter>
      </Table>
      <SelectBidDialog quotationId={quotation.id} bid={selecting} onOpenChange={(open) => !open && setSelecting(null)} />
    </Card>
  );
}
