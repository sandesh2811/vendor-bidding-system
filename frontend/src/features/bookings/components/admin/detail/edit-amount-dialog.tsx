"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { PendingButton } from "@/components/form/pending-button";
import { TextField } from "@/components/form/text-field";
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
import { formatMoney } from "@/lib/format";
import { useUpdateBooking } from "../../../hooks/use-booking-mutations";
import { type EditAmountInput, type EditAmountValues, editAmountSchema } from "../../../schemas/booking-forms.schema";
import type { BookingDetail } from "../../../types";

const FORM_ID = "edit-amount-form";

export function EditAmountDialog({
  booking,
  open,
  onOpenChange,
}: {
  booking: BookingDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit amount</DialogTitle>
          <DialogDescription>
            {formatMoney(booking.paidAmount)} is already paid, so the amount can&apos;t go below that.
          </DialogDescription>
        </DialogHeader>
        {open && <AmountForm booking={booking} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function AmountForm({ booking, onDone }: { booking: BookingDetail; onDone: () => void }) {
  const mutation = useUpdateBooking(booking.id);
  const form = useForm<EditAmountInput, unknown, EditAmountValues>({
    resolver: zodResolver(editAmountSchema(Number(booking.paidAmount))),
    mode: "onTouched",
    defaultValues: { amount: booking.amount, notes: "" },
  });

  function onSubmit(values: EditAmountValues) {
    mutation.mutate(
      { amount: Number(values.amount), notes: values.notes },
      {
        onSuccess: (updated) => {
          toast.success(`Amount changed to ${formatMoney(updated.amount)}`);
          onDone();
        },
      },
    );
  }

  return (
    <FormProvider {...form}>
      <form id={FORM_ID} noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <TextField<EditAmountInput> name="amount" label="New amount (Rs)" inputMode="decimal" />
        <TextField<EditAmountInput>
          name="notes"
          label="Reason"
          multiline
          rows={3}
          placeholder="e.g. Discount negotiated after selection"
        />
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <PendingButton type="submit" form={FORM_ID} pending={mutation.isPending}>
            Save amount
          </PendingButton>
        </DialogFooter>
      </form>
    </FormProvider>
  );
}
