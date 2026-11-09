"use client";

import { toast } from "sonner";
import { ConfirmDialog } from "@/components/layout/confirm-dialog";
import { useRetainedValue } from "@/hooks/use-retained-value";
import { formatMoney } from "@/lib/format";
import { useSelectBid } from "../../hooks/use-bid-mutations";
import type { ComparedBid } from "../../types";

export function SelectBidDialog({
  quotationId,
  bid,
  onOpenChange,
}: {
  quotationId: string;
  bid: ComparedBid | null;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useSelectBid(quotationId);
  /* keep the copy stable while the dialog animates closed */
  const shown = useRetainedValue(bid);

  function confirm() {
    if (!shown) return;
    mutation.mutate(shown.id, {
      onSuccess: (booking) => toast.success(`Booking created for ${shown.vendor.name} · ${formatMoney(booking.amount)}`),
      /* on a 409 (already awarded) the error toast shows and the data refetches */
      onSettled: () => onOpenChange(false),
    });
  }

  return (
    <ConfirmDialog
      open={bid !== null}
      onOpenChange={onOpenChange}
      title={`Select ${shown?.vendor.name}?`}
      description={
        shown &&
        `Their bid of ${formatMoney(shown.totalAmount)} wins and a booking is created. Every other bid is rejected and the quotation is awarded. This can't be undone.`
      }
      confirmLabel="Select bid"
      pending={mutation.isPending}
      onConfirm={confirm}
    />
  );
}
