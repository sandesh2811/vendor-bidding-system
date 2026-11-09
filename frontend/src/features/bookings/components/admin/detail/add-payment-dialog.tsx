"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { DatePicker } from "@/components/form/date-picker";
import { FormField } from "@/components/form/form-field";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { businessToday } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS } from "../../../constants";
import { useAddPayment } from "../../../hooks/use-booking-mutations";
import {
  type PaymentFormInput,
  type PaymentFormValues,
  paymentFormSchema,
} from "../../../schemas/booking-forms.schema";
import type { BookingDetail } from "../../../types";

const FORM_ID = "add-payment-form";

export function AddPaymentDialog({
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
          <DialogTitle>Add payment</DialogTitle>
          <DialogDescription>
            {formatMoney(booking.pendingAmount)} pending for {booking.vendor.name}.
          </DialogDescription>
        </DialogHeader>
        {/* mounted per opening, so the defaults are the current pending amount and today */}
        {open && <PaymentForm booking={booking} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function PaymentForm({ booking, onDone }: { booking: BookingDetail; onDone: () => void }) {
  const mutation = useAddPayment(booking.id);
  const form = useForm<PaymentFormInput, unknown, PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema(Number(booking.pendingAmount))),
    mode: "onTouched",
    defaultValues: {
      amount: booking.pendingAmount,
      paidAt: businessToday(),
      reference: "",
      note: "",
    },
  });

  function onSubmit(values: PaymentFormValues) {
    mutation.mutate(
      {
        amount: Number(values.amount),
        paidAt: values.paidAt,
        method: values.method,
        reference: values.reference || null,
        note: values.note || null,
      },
      {
        onSuccess: (payment) => {
          toast.success(`Payment of ${formatMoney(payment.amount)} recorded`);
          onDone();
        },
      },
    );
  }

  return (
    <FormProvider {...form}>
      <form id={FORM_ID} noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField<PaymentFormInput> name="amount" label="Amount (Rs)" inputMode="decimal" placeholder="0.00" />
          <FormField<PaymentFormInput, "paidAt"> name="paidAt" label="Paid on">
            {({ field, id, invalid }) => (
              <DatePicker
                id={id}
                value={field.value}
                onChange={field.onChange}
                max={businessToday()}
                invalid={invalid}
              />
            )}
          </FormField>
        </div>
        <FormField<PaymentFormInput, "method"> name="method" label="Method">
          {({ field, id, invalid }) => (
            <Select items={PAYMENT_METHOD_LABELS} value={field.value ?? null} onValueChange={field.onChange}>
              <SelectTrigger id={id} aria-invalid={invalid} onBlur={field.onBlur} className="w-full">
                <SelectValue placeholder="Select a method" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {PAYMENT_METHOD_LABELS[method]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
        <TextField<PaymentFormInput>
          name="reference"
          label="Reference"
          optional
          placeholder="Transaction id or cheque number"
        />
        <TextField<PaymentFormInput> name="note" label="Note" optional multiline rows={2} />
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <PendingButton type="submit" form={FORM_ID} pending={mutation.isPending}>
            Save payment
          </PendingButton>
        </DialogFooter>
      </form>
    </FormProvider>
  );
}
