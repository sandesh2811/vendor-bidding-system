"use client";

import { CalendarClockIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DatePicker } from "@/components/form/date-picker";
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
import { businessToday, formatDay } from "@/lib/dates";
import { useUpdateQuotation } from "../../hooks/use-quotation-mutations";
import type { QuotationDetail } from "../../types";

/* once sent, the response deadline is the only thing an admin can change */
export function ChangeDeadlineDialog({ quotation }: { quotation: QuotationDetail }) {
  const [open, setOpen] = useState(false);
  const [deadline, setDeadline] = useState(quotation.responseDeadline ?? "");
  const mutation = useUpdateQuotation(quotation.id);

  function change(next: boolean) {
    setOpen(next);
    if (next) setDeadline(quotation.responseDeadline ?? "");
  }

  function save() {
    mutation.mutate(
      { responseDeadline: deadline },
      {
        onSuccess: () => {
          toast.success(`Deadline set to ${formatDay(deadline)}`);
          setOpen(false);
        },
      },
    );
  }

  return (
    <>
      <Button variant="outline" onClick={() => change(true)}>
        <CalendarClockIcon data-icon="inline-start" />
        Change deadline
      </Button>
      <Dialog open={open} onOpenChange={change}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Change response deadline</DialogTitle>
            <DialogDescription>
              Once sent, only the deadline can change. Moving it later reopens bidding if it closed because the deadline passed; a quotation you closed yourself stays closed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="response-deadline">Respond by</Label>
            <DatePicker
              id="response-deadline"
              value={deadline}
              onChange={setDeadline}
              min={businessToday()}
              max={quotation.eventDate}
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <PendingButton
              onClick={save}
              pending={mutation.isPending}
              disabled={!deadline || deadline === quotation.responseDeadline}
            >
              Save deadline
            </PendingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
