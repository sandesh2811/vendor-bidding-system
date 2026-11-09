"use client";

import { BanIcon, LockIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/layout/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useCancelQuotation, useCloseQuotation } from "../../hooks/use-quotation-mutations";
import type { QuotationDetail } from "../../types";

/* Close while open; Cancel until awarded. Each asks first */
export function QuotationStatusActions({ quotation }: { quotation: QuotationDetail }) {
  const [confirming, setConfirming] = useState<"close" | "cancel" | null>(null);
  const close = useCloseQuotation(quotation.id);
  const cancel = useCancelQuotation(quotation.id);
  const mutation = confirming === "cancel" ? cancel : close;

  const canClose = quotation.status === "open";
  const canCancel = ["draft", "open", "closed"].includes(quotation.status);

  function confirm() {
    mutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(confirming === "cancel" ? "Quotation cancelled" : "Quotation closed");
        setConfirming(null);
      },
    });
  }

  return (
    <>
      {canClose && (
        <Button variant="outline" onClick={() => setConfirming("close")}>
          <LockIcon data-icon="inline-start" />
          Close
        </Button>
      )}
      {canCancel && (
        <Button variant="outline" onClick={() => setConfirming("cancel")}>
          <BanIcon data-icon="inline-start" />
          Cancel
        </Button>
      )}
      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={confirming === "cancel" ? `Cancel ${quotation.title}?` : `Close ${quotation.title}?`}
        description={
          confirming === "cancel"
            ? "Every submitted bid will be rejected. Vendors will see the request as cancelled. This can't be undone."
            : "Vendors can no longer submit or change bids. You can still compare bids and select a winner."
        }
        confirmLabel={confirming === "cancel" ? "Cancel quotation" : "Close bidding"}
        destructive={confirming === "cancel"}
        pending={mutation.isPending}
        onConfirm={confirm}
      />
    </>
  );
}
