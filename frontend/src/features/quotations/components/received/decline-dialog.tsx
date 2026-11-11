"use client";

import { BanIcon } from "lucide-react";
import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QUOTATION_LIMITS } from "../../constants";
import { useDeclineQuotation } from "../../hooks/use-decline-quotation";

/* the vendor says no to a request, optionally saying why; Mero Event can send it again later */
export function DeclineDialog({ quotationId }: { quotationId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const mutation = useDeclineQuotation(quotationId);

  function decline() {
    mutation.mutate(reason.trim() || null, { onSuccess: () => setOpen(false) });
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <BanIcon data-icon="inline-start" />
        Decline
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Decline this request?</DialogTitle>
            <DialogDescription>
              You won&apos;t be able to bid unless Mero Event sends it to you again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="decline-reason">
              Reason <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="decline-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={QUOTATION_LIMITS.DECLINE_REASON_MAX}
              rows={3}
              placeholder="e.g. Already booked on that date"
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <PendingButton variant="destructive" onClick={decline} pending={mutation.isPending}>
              Decline request
            </PendingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
