"use client";

import { useQuery } from "@tanstack/react-query";
import { PageTitle } from "@/components/layout/page-header";
import { QueryBoundary } from "@/components/layout/query-boundary";
import { SectionCard } from "@/components/layout/section-card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EventFacts } from "@/features/quotations/components/shared/event-facts";
import { formatDate, formatMoney } from "@/lib/format";
import { vendorBookingQuery } from "../../api/bookings.api";
import type { QuotationItem } from "@/features/quotations/types";
import { cn } from "@/lib/utils";
import type { VendorBookingDetail } from "../../types";
import { BookingSkeleton } from "../shared/booking-skeleton";
import { BookingStatusBadge, PaymentStatusBadge } from "../shared/booking-status-badge";
import { MoneySummary } from "../shared/money-summary";
import { PaymentsTable } from "../shared/payments-table";

/* read-only: the event, the prices agreed in the winning bid, and every payment */
export function VendorBookingDetailView({ id }: { id: string }) {
  const query = useQuery(vendorBookingQuery(id));

  return (
    <QueryBoundary query={query} errorTitle="Couldn't load this booking" fallback={<BookingSkeleton className="" />}>
      {(booking) => (
        <>
          <PageTitle
            title={booking.quotation.title}
            badge={
              <>
                <BookingStatusBadge status={booking.status} />
                <PaymentStatusBadge status={booking.paymentStatus} />
              </>
            }
            description={`Booked ${formatDate(booking.createdAt)}`}
            back={{ href: "/vendor/bookings", label: "Back to bookings" }}
            className="px-0 pt-0 pb-6"
          />
          <div className="flex flex-col gap-6 md:gap-8">
            <MoneySummary booking={booking} />
            <SectionCard title="Event">
              <EventFacts quotation={booking.quotation} />
            </SectionCard>
            <SectionCard
              title="Agreed items"
              description={`From your winning bid, last updated ${formatDate(booking.bid.updatedAt)}`}
              contentClassName="px-0"
            >
              <AgreedItems booking={booking} />
            </SectionCard>
            <SectionCard title="Payments" contentClassName="px-0">
              <PaymentsTable payments={booking.payments} />
            </SectionCard>
          </div>
        </>
      )}
    </QueryBoundary>
  );
}

function AgreedItems({ booking }: { booking: VendorBookingDetail }) {
  const { quotation, bid } = booking;
  const lines = new Map(bid.items.map((line) => [line.quotationItemId, line]));
  /* Mero Event can adjust the amount after booking; show both when they differ */
  const adjusted = Number(booking.amount) !== Number(bid.totalAmount);
  const rows = quotation.items.map((item) => {
    const line = lines.get(item.id);
    return { item, line, offered: Number(line?.unitPrice ?? 0) > 0 };
  });
  const quantity = (item: QuotationItem) => `${item.quantity.toLocaleString()}${item.unit ? ` ${item.unit}` : ""}`;
  const totals = [
    { label: "Bid total", value: bid.totalAmount, strong: !adjusted },
    ...(adjusted ? [{ label: "Booking amount (adjusted by Mero Event)", value: booking.amount, strong: true }] : []),
  ];

  return (
    <div className="flex flex-col">
      {/* phones: one stacked row per item */}
      <ul className="divide-y border-t sm:hidden">
        {rows.map(({ item, line, offered }) => (
          <li key={item.id} className="flex items-start justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="font-medium break-words">{item.name}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {quantity(item)}
                {offered && ` × ${formatMoney(line?.unitPrice ?? 0)}`}
              </p>
              {item.notes && <p className="mt-0.5 text-xs break-words text-muted-foreground">{item.notes}</p>}
            </div>
            <span className={cn("shrink-0 tabular-nums", offered ? "font-medium" : "text-sm text-muted-foreground")}>
              {offered ? formatMoney(line?.lineTotal ?? 0) : "Not offered"}
            </span>
          </li>
        ))}
        {totals.map((total) => (
          <li key={total.label} className="flex items-baseline justify-between gap-4 px-4 py-3">
            <span className={cn("text-sm", !total.strong && "text-muted-foreground")}>{total.label}</span>
            <span className={cn("tabular-nums", total.strong ? "font-semibold" : "text-muted-foreground")}>
              {formatMoney(total.value)}
            </span>
          </li>
        ))}
      </ul>

      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">Item</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Unit price</TableHead>
              <TableHead className="pr-6 text-right">Line total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ item, line, offered }) => (
              <TableRow key={item.id} className="hover:bg-transparent">
                <TableCell className="py-3 pl-6 whitespace-normal">
                  <div className="font-medium">{item.name}</div>
                  {item.notes && <div className="text-xs text-muted-foreground">{item.notes}</div>}
                </TableCell>
                <TableCell className="text-right tabular-nums">{quantity(item)}</TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {offered ? formatMoney(line?.unitPrice ?? 0) : "Not offered"}
                </TableCell>
                <TableCell className="pr-6 text-right font-medium tabular-nums">
                  {offered ? formatMoney(line?.lineTotal ?? 0) : <span className="text-muted-foreground">None</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="bg-transparent">
            {totals.map((total) => (
              <TableRow key={total.label} className="hover:bg-transparent">
                <TableCell colSpan={3} className={cn("pl-6", total.strong ? "font-medium" : "text-muted-foreground")}>
                  {total.label}
                </TableCell>
                <TableCell
                  className={cn(
                    "pr-6 text-right tabular-nums",
                    total.strong ? "font-semibold" : "text-muted-foreground",
                  )}
                >
                  {formatMoney(total.value)}
                </TableCell>
              </TableRow>
            ))}
          </TableFooter>
        </Table>
      </div>

      {bid.notes && (
        <div className="mx-4 mt-4 rounded-lg bg-muted/50 px-4 py-3 sm:mx-6">
          <p className="text-xs text-muted-foreground">Your notes on the bid</p>
          <p className="text-sm break-words whitespace-pre-line">{bid.notes}</p>
        </div>
      )}
    </div>
  );
}
