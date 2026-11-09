"use client";

import { type ColumnClasses, columnHelper } from "@/components/data-table/table-features";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDay } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import type { Booking } from "../../../types";
import { BookingStatusBadge, PaymentStatusBadge } from "../../shared/booking-status-badge";

const helper = columnHelper<Booking>();

const money = (amount: string) => <span className="tabular-nums">{formatMoney(amount)}</span>;

/* narrow screens keep the event (with the vendor folded in), pending and payment status */
export const bookingColumnClasses: ColumnClasses = {
  vendor: "hidden md:table-cell",
  amount: "hidden lg:table-cell",
  paidAmount: "hidden lg:table-cell",
  status: "hidden sm:table-cell",
};

export const bookingSkeletons = {
  quotation: (
    <div className="space-y-1.5">
      <Skeleton className="h-3.5 w-40" />
      <Skeleton className="h-3 w-28" />
    </div>
  ),
};

export const bookingColumns = helper.columns([
  helper.accessor("quotation", {
    header: "Event",
    cell: ({ row: { original: booking } }) => (
      <div className="max-w-72 min-w-0">
        <div className="truncate font-medium text-foreground">{booking.quotation.title}</div>
        <div className="truncate text-xs text-muted-foreground">
          {formatDay(booking.quotation.eventDate)}
          <span className="md:hidden"> · {booking.vendor.name}</span>
        </div>
      </div>
    ),
  }),
  helper.accessor("vendor", {
    header: "Vendor",
    cell: ({ getValue }) => getValue().name,
  }),
  helper.accessor("amount", {
    header: "Amount",
    cell: ({ getValue }) => money(getValue()),
  }),
  helper.accessor("paidAmount", {
    header: "Paid",
    cell: ({ getValue }) => money(getValue()),
  }),
  helper.accessor("pendingAmount", {
    header: "Pending",
    cell: ({ getValue }) => money(getValue()),
  }),
  helper.accessor("paymentStatus", {
    header: "Payment",
    cell: ({ getValue }) => <PaymentStatusBadge status={getValue()} />,
  }),
  helper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => <BookingStatusBadge status={getValue()} />,
  }),
]);
