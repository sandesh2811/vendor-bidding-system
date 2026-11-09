"use client";

import { useQuery } from "@tanstack/react-query";
import { PageTitle } from "@/components/layout/page-header";
import { QueryBoundary } from "@/components/layout/query-boundary";
import { SectionCard } from "@/components/layout/section-card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EventFacts } from "@/features/quotations/components/shared/event-facts";
import { formatDate, formatMoney } from "@/lib/format";
import { vendorBookingQuery } from "../../api/bookings.api";
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
            <SectionCard title="Agreed items" contentClassName="px-0">
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

function AgreedItems({ booking: { quotation, bid } }: { booking: VendorBookingDetail }) {
  const lines = new Map(bid.items.map((line) => [line.quotationItemId, line]));

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-6 text-xs text-muted-foreground">Item</TableHead>
          <TableHead className="text-right text-xs text-muted-foreground">Qty</TableHead>
          <TableHead className="text-right text-xs text-muted-foreground">Unit price</TableHead>
          <TableHead className="pr-6 text-right text-xs text-muted-foreground">Line total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {quotation.items.map((item) => (
          <TableRow key={item.id} className="hover:bg-transparent">
            <TableCell className="pl-6 font-medium whitespace-normal">{item.name}</TableCell>
            <TableCell className="text-right tabular-nums">
              {item.quantity.toLocaleString()}
              {item.unit && <span className="ml-1 text-muted-foreground">{item.unit}</span>}
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatMoney(lines.get(item.id)?.unitPrice ?? 0)}</TableCell>
            <TableCell className="pr-6 text-right tabular-nums">
              {formatMoney(lines.get(item.id)?.lineTotal ?? 0)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter className="bg-transparent">
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={3} className="pl-6 font-medium">
            Bid total
          </TableCell>
          <TableCell className="pr-6 text-right font-semibold tabular-nums">{formatMoney(bid.totalAmount)}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
