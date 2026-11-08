"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PendingButton } from "@/components/form/pending-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAddRecipients } from "../../hooks/use-quotation-mutations";
import { VendorPicker } from "../shared/vendor-picker";

/* adds vendors to an existing quotation; vendors who already have it aren't offered */
export function SendToVendorsDialog({
  quotationId,
  sentTo,
  open,
  onOpenChange,
}: {
  quotationId: string;
  sentTo: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useAddRecipients(quotationId);
  const [vendorIds, setVendorIds] = useState<string[]>([]);

  function close(next: boolean) {
    onOpenChange(next);
    if (!next) setVendorIds([]);
  }

  function send() {
    mutation.mutate(vendorIds, {
      onSuccess: () => {
        toast.success(`Sent to ${vendorIds.length} vendor${vendorIds.length === 1 ? "" : "s"}`);
        close(false);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send to vendors</DialogTitle>
          <DialogDescription>They&apos;ll see this request in their portal right away.</DialogDescription>
        </DialogHeader>
        <VendorPicker id="add-recipients" value={vendorIds} onChange={setVendorIds} excludeIds={sentTo} />
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <PendingButton onClick={send} pending={mutation.isPending} disabled={!vendorIds.length}>
            Send
          </PendingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
