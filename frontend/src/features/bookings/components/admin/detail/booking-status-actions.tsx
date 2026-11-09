"use client";

import { BanIcon, CheckIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/layout/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useUpdateBooking } from "../../../hooks/use-booking-mutations";
import type { BookingDetail } from "../../../types";

/* a confirmed booking can be completed or cancelled; both are final, so each asks first */
export function BookingStatusActions({ booking }: { booking: BookingDetail }) {
  const [confirming, setConfirming] = useState<"completed" | "cancelled" | null>(null);
  const mutation = useUpdateBooking(booking.id);

  if (booking.status !== "confirmed") return null;

  function confirm() {
    if (!confirming) return;
    mutation.mutate(
      { status: confirming },
      {
        onSuccess: () => {
          toast.success(confirming === "cancelled" ? "Booking cancelled" : "Booking marked completed");
          setConfirming(null);
        },
      },
    );
  }

  return (
    <>
      <Button variant="outline" onClick={() => setConfirming("completed")}>
        <CheckIcon data-icon="inline-start" />
        Mark completed
      </Button>
      <Button variant="outline" onClick={() => setConfirming("cancelled")}>
        <BanIcon data-icon="inline-start" />
        Cancel booking
      </Button>
      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={confirming === "cancelled" ? "Cancel this booking?" : "Mark this booking completed?"}
        description={
          confirming === "cancelled"
            ? "No more payments or amount changes. Payments already recorded stay on record. This can't be undone."
            : "The event is done. You can still record payments and adjust the amount."
        }
        confirmLabel={confirming === "cancelled" ? "Cancel booking" : "Mark completed"}
        destructive={confirming === "cancelled"}
        pending={mutation.isPending}
        onConfirm={confirm}
      />
    </>
  );
}
