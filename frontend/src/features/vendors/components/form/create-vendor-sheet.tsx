"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { FormSheet } from "@/components/form/form-sheet";
import { PendingButton } from "@/components/form/pending-button";
import { FieldGroup, FieldSeparator } from "@/components/ui/field";
import { useCreateVendor } from "../../hooks/use-vendor-mutations";
import {
  type CreateVendorFormInput,
  type CreateVendorFormValues,
  createVendorSchema,
  toCreateVendor,
  vendorDetailsDefaults,
} from "../../schemas/vendor-forms.schema";
import { VendorDetailsFields } from "./vendor-details-fields";
import { VendorLoginFields } from "./vendor-login-fields";

const FORM_ID = "create-vendor-form";

export function CreateVendorSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const mutation = useCreateVendor();

  return (
    <FormSheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) mutation.reset();
      }}
      title="Add vendor"
      description="Creates the vendor and their portal login in one step."
      actions={
        <PendingButton type="submit" form={FORM_ID} pending={mutation.isPending}>
          Add vendor
        </PendingButton>
      }
    >
      {/* mounted per opening, so every open starts from an empty form */}
      {open && <CreateVendorForm onSubmit={(input) => mutation.mutate(input, { onSuccess: () => onOpenChange(false) })} />}
    </FormSheet>
  );
}

function CreateVendorForm({ onSubmit }: { onSubmit: (input: ReturnType<typeof toCreateVendor>) => void }) {
  const form = useForm<CreateVendorFormInput, unknown, CreateVendorFormValues>({
    resolver: zodResolver(createVendorSchema),
    mode: "onTouched",
    defaultValues: { ...vendorDetailsDefaults(), loginName: "", loginEmail: "", loginPassword: "" },
  });

  return (
    <FormProvider {...form}>
      <form id={FORM_ID} noValidate onSubmit={form.handleSubmit((values) => onSubmit(toCreateVendor(values)))}>
        <FieldGroup className="gap-8">
          <VendorDetailsFields />
          <FieldSeparator />
          <VendorLoginFields />
        </FieldGroup>
      </form>
    </FormProvider>
  );
}
