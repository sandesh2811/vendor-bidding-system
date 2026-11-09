"use client";

import { type ColumnClasses, columnHelper } from "@/components/data-table/table-features";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDay } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { RequestStatusBadge } from "@/features/bids/components/vendor/request-status-badge";
import type { ReceivedQuotation } from "../../types";
import { DeadlineHint } from "../shared/deadline-hint";
import { EventTypeBadge } from "../shared/event-type-badge";

const helper = columnHelper<ReceivedQuotation>();

export const receivedColumnClasses: ColumnClasses = {
  eventType: "hidden sm:table-cell",
  eventDate: "hidden md:table-cell",
  receivedAt: "hidden lg:table-cell",
};

export const receivedSkeletons = {
  title: (
    <div className="space-y-1.5">
      <Skeleton className="h-3.5 w-40" />
      <Skeleton className="h-3 w-28" />
    </div>
  ),
};

export const receivedColumns = helper.columns([
  helper.accessor("title", {
    header: "Request",
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
  helper.display({
    id: "status",
    header: "Status",
    cell: ({ row: { original: quotation } }) => <RequestStatusBadge quotation={quotation} />,
  }),
  helper.accessor("eventType", {
    header: "Type",
    cell: ({ getValue }) => <EventTypeBadge eventType={getValue()} />,
  }),
  helper.accessor("eventDate", {
    header: "Event date",
    cell: ({ getValue }) => <span className="tabular-nums">{formatDay(getValue())}</span>,
  }),
  helper.accessor("responseDeadline", {
    header: "Respond by",
    cell: ({ getValue }) => {
      const deadline = getValue();
      return deadline ? (
        <div>
          <div className="tabular-nums">{formatDay(deadline)}</div>
          <DeadlineHint deadline={deadline} />
        </div>
      ) : (
        <span className="text-muted-foreground">Open</span>
      );
    },
  }),
  helper.accessor("receivedAt", {
    header: "Received",
    cell: ({ getValue }) => <span className="text-muted-foreground tabular-nums">{formatDate(getValue())}</span>,
  }),
]);
