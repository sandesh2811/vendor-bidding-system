"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { FormSheet } from "@/components/form/form-sheet";
import { PendingButton } from "@/components/form/pending-button";
import { TextField } from "@/components/form/text-field";
import { FieldGroup } from "@/components/ui/field";
import { PAYMENT_LIMITS, VENDOR_LIMITS } from "../../constants";
import { useClearBankAccount, useUpdateBankAccount } from "../../hooks/use-payment-details-mutations";
import {
  type BankAccountFormInput,
  type BankAccountFormValues,
  bankAccountSchema,
  toBankAccount,
} from "../../schemas/vendor-forms.schema";
import type { PaymentDetails } from "../../types";

const FORM_ID = "bank-account-form";

/* the vendor sets or replaces the bank account Mero Event pays into, or removes it */
export function BankAccountSheet({
  details,
  open,
  onOpenChange,
}: {
  details: PaymentDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const save = useUpdateBankAccount();
  const clear = useClearBankAccount();
  const hasBank = Boolean(details.accountNumber);

  function close(next: boolean) {
    onOpenChange(next);
    if (!next) {
      save.reset();
      clear.reset();
    }
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={close}
      title={hasBank ? "Edit bank account" : "Add bank account"}
      description="Mero Event pays your bookings into this account. Double-check the number."
      footerStart={
        hasBank && (
          <PendingButton
            type="button"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            pending={clear.isPending}
            onClick={() => clear.mutate(undefined, { onSuccess: () => close(false) })}
          >
            Remove
          </PendingButton>
        )
      }
      actions={
        <PendingButton type="submit" form={FORM_ID} pending={save.isPending}>
          Save bank account
        </PendingButton>
      }
    >
      {/* mounted per opening, so the fields start from the saved account */}
      {open && (
        <BankAccountForm
          details={details}
          onSubmit={(values) => save.mutate(toBankAccount(values), { onSuccess: () => close(false) })}
        />
      )}
    </FormSheet>
  );
}

function BankAccountForm({
  details,
  onSubmit,
}: {
  details: PaymentDetails;
  onSubmit: (values: BankAccountFormValues) => void;
}) {
  const form = useForm<BankAccountFormInput, unknown, BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
    mode: "onTouched",
    defaultValues: {
      bankName: details.bankName ?? "",
      accountName: details.accountName ?? "",
      accountNumber: details.accountNumber ?? "",
      branch: details.branch ?? "",
    },
  });

  return (
    <FormProvider {...form}>
      <form id={FORM_ID} noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <TextField<BankAccountFormInput>
            name="bankName"
            label="Bank"
            maxLength={VENDOR_LIMITS.NAME_MAX}
            placeholder="e.g. Nabil Bank"
          />
          <TextField<BankAccountFormInput>
            name="accountName"
            label="Account name"
            maxLength={VENDOR_LIMITS.NAME_MAX}
            description="The account holder's name, exactly as the bank has it."
          />
          <TextField<BankAccountFormInput>
            name="accountNumber"
            label="Account number"
            autoComplete="off"
            maxLength={PAYMENT_LIMITS.ACCOUNT_NUMBER_MAX}
            inputClassName="font-mono"
          />
          <TextField<BankAccountFormInput> name="branch" label="Branch" optional maxLength={VENDOR_LIMITS.NAME_MAX} />
        </FieldGroup>
      </form>
    </FormProvider>
  );
}
