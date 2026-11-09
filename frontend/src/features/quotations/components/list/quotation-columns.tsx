"use client";

import { type ColumnClasses, columnHelper } from "@/components/data-table/table-features";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDay } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import type { Quotation } from "../../types";
import { DeadlineHint } from "../shared/deadline-hint";
import { EventTypeBadge } from "../shared/event-type-badge";
import { QuotationStatusBadge } from "../shared/quotation-status-badge";
import { RecipientCount } from "../shared/recipient-count";

const helper = columnHelper<Quotation>();

/* narrow screens keep the title (with date and location folded in) and the vendor count */
export const quotationColumnClasses: ColumnClasses = {
  eventType: "hidden sm:table-cell",
  bidCount: "hidden sm:table-cell",
  eventDate: "hidden md:table-cell",
  responseDeadline: "hidden lg:table-cell",
  createdAt: "hidden xl:table-cell",
};

export const quotationSkeletons = {
  title: (
    <div className="space-y-1.5">
      <Skeleton className="h-3.5 w-40" />
      <Skeleton className="h-3 w-28" />
    </div>
  ),
};

export const quotationColumns = helper.columns([
  helper.accessor("title", {
    header: "Quotation",
    cell: ({ row: { original: quotation } }) => (
      <div className="max-w-72 min-w-0">
        <div className="truncate font-medium text-foreground">{quotation.title}</div>
        <div className="truncate text-xs text-muted-foreground">
          <span className="md:hidden">{formatDay(quotation.eventDate)} · </span>
          {quotation.location}
        </div>
      </div>
    ),
  }),
  helper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => <QuotationStatusBadge status={getValue()} />,
  }),
  helper.accessor("eventType", {
    header: "Type",
    cell: ({ getValue }) => <EventTypeBadge eventType={getValue()} />,
  }),
  helper.accessor("eventDate", {
    header: "Event date",
    cell: ({ getValue }) => <span className="tabular-nums">{formatDay(getValue())}</span>,
  }),
  helper.accessor("recipients", {
    header: "Sent to",
    cell: ({ getValue }) => <RecipientCount count={getValue().length} />,
  }),
  helper.accessor("bidCount", {
    header: "Bids",
    cell: ({ row: { original: quotation } }) =>
      quotation.recipients.length > 0 && (
        <span className="text-muted-foreground tabular-nums">
          <span className="font-medium text-foreground">{quotation.bidCount ?? 0}</span> / {quotation.recipients.length}
        </span>
      ),
  }),
  helper.accessor("responseDeadline", {
    header: "Respond by",
    cell: ({ getValue }) => {
      const deadline = getValue();
      return (
        deadline && (
          <div>
            <div className="tabular-nums">{formatDay(deadline)}</div>
            <DeadlineHint deadline={deadline} />
          </div>
        )
      );
    },
  }),
  helper.accessor("createdAt", {
    header: "Created",
    cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{formatDate(getValue())}</span>,
  }),
]);
