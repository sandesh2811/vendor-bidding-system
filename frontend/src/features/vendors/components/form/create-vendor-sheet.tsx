"use client";

import type { FormEvent } from "react";
import { FormSheet } from "@/components/form/form-sheet";
import { PendingButton } from "@/components/form/pending-button";
import { FieldGroup, FieldSeparator } from "@/components/ui/field";
import { useCreateVendor } from "../../hooks/use-vendor-mutations";
import { readCreateVendor } from "../../utils/vendor-form-data";
import { VendorDetailsFields } from "./vendor-details-fields";
import { VendorLoginFields } from "./vendor-login-fields";

const FORM_ID = "create-vendor-form";

export function CreateVendorSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const mutation = useCreateVendor();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    mutation.mutate(readCreateVendor(new FormData(e.currentTarget)), { onSuccess: () => onOpenChange(false) });
  }

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
      <form id={FORM_ID} onSubmit={onSubmit}>
        <FieldGroup className="gap-8">
          <VendorDetailsFields />
          <FieldSeparator />
          <VendorLoginFields />
        </FieldGroup>
      </form>
    </FormSheet>
  );
}
