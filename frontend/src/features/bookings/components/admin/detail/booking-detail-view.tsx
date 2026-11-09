"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalLinkIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/layout/confirm-dialog";
import { LinkButton } from "@/components/layout/link-button";
import { AdminTopBar, PageTitle } from "@/components/layout/page-header";
import { QueryBoundary } from "@/components/layout/query-boundary";
import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import { EventFacts } from "@/features/quotations/components/shared/event-facts";
import { useRetainedValue } from "@/hooks/use-retained-value";
import { formatDate, formatMoney } from "@/lib/format";
import { bookingQuery } from "../../../api/bookings.api";
import { useDeletePayment } from "../../../hooks/use-booking-mutations";
import type { BookingDetail, Payment } from "../../../types";
import { BookingSkeleton } from "../../shared/booking-skeleton";
import { BookingStatusBadge, PaymentStatusBadge } from "../../shared/booking-status-badge";
import { MoneySummary } from "../../shared/money-summary";
import { PaymentsTable } from "../../shared/payments-table";
import { AddPaymentDialog } from "./add-payment-dialog";
import { BookingStatusActions } from "./booking-status-actions";
import { EditAmountDialog } from "./edit-amount-dialog";

export function BookingDetailView({ id }: { id: string }) {
  const query = useQuery(bookingQuery(id));

  return (
    <>
      <AdminTopBar section="Bookings" />
      <QueryBoundary query={query} errorTitle="Couldn't load this booking" fallback={<BookingSkeleton />}>
        {(booking) => <BookingDetailContent booking={booking} />}
      </QueryBoundary>
    </>
  );
}

function BookingDetailContent({ booking }: { booking: BookingDetail }) {
  const [dialog, setDialog] = useState<"payment" | "amount" | null>(null);
  const [deleting, setDeleting] = useState<Payment | null>(null);
  const shownDeleting = useRetainedValue(deleting);
  const deleteMutation = useDeletePayment(booking.id);

  const cancelled = booking.status === "cancelled";
  const canPay = !cancelled && Number(booking.pendingAmount) > 0;

  function confirmDelete() {
    if (!shownDeleting) return;
    deleteMutation.mutate(shownDeleting.id, {
      onSuccess: () => {
        toast.success("Payment deleted");
        setDeleting(null);
      },
    });
  }

  return (
    <>
      <PageTitle
        title={booking.quotation.title}
        badge={
          <>
            <BookingStatusBadge status={booking.status} />
            <PaymentStatusBadge status={booking.paymentStatus} />
          </>
        }
        description={`${booking.vendor.name} · booked ${formatDate(booking.createdAt)}`}
        back={{ href: "/admin/bookings", label: "Back to bookings" }}
        actions={
          <>
            <BookingStatusActions booking={booking} />
            {!cancelled && (
              <Button variant="outline" onClick={() => setDialog("amount")}>
                <PencilIcon data-icon="inline-start" />
                Edit amount
              </Button>
            )}
          </>
        }
      />
      <div className="flex flex-col gap-6 px-4 pb-8 md:px-8">
        <MoneySummary booking={booking} />
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <SectionCard
            title="Payments"
            description="Payments are never edited: delete a wrong one and add it again."
            action={
              canPay && (
                <Button size="sm" onClick={() => setDialog("payment")}>
                  <PlusIcon data-icon="inline-start" />
                  Add payment
                </Button>
              )
            }
            contentClassName="px-0"
          >
            <PaymentsTable
              payments={booking.payments}
              showNote
              action={(payment) => (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete payment of ${formatMoney(payment.amount)}`}
                  onClick={() => setDeleting(payment)}
                >
                  <Trash2Icon />
                </Button>
              )}
            />
          </SectionCard>
          <div className="flex flex-col gap-6">
            <SectionCard
              title="Event"
              action={
                <LinkButton variant="ghost" size="sm" href={`/admin/quotations/${booking.quotationId}`}>
                  Quotation & bids
                  <ExternalLinkIcon data-icon="inline-end" />
                </LinkButton>
              }
            >
              <EventFacts quotation={booking.quotation} />
            </SectionCard>
            {booking.notes && (
              <SectionCard title="Notes">
                <p className="text-sm whitespace-pre-line">{booking.notes}</p>
              </SectionCard>
            )}
          </div>
        </div>
      </div>
      <AddPaymentDialog
        booking={booking}
        open={dialog === "payment"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <EditAmountDialog
        booking={booking}
        open={dialog === "amount"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this payment?"
        description={
          shownDeleting &&
          `The payment of ${formatMoney(shownDeleting.amount)} is removed and the pending amount goes back up.`
        }
        confirmLabel="Delete payment"
        destructive
        pending={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />
    </>
  );
}
