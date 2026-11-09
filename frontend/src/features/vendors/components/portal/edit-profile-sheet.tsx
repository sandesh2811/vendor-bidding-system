"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { FormSheet } from "@/components/form/form-sheet";
import { OptionalHint } from "@/components/form/optional-hint";
import { PendingButton } from "@/components/form/pending-button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateVendorProfile, vendorProfileQuery } from "../../api/vendor-portal.api";
import { VENDOR_LIMITS } from "../../constants";
import type { Vendor } from "../../types";
import { readText } from "../../utils/vendor-form-data";

const FORM_ID = "edit-profile-form";
const { NAME_MAX, TEXT_MAX } = VENDOR_LIMITS;

/* the vendor edits its own business details; emails, password and category stay with Mero Event */
export function EditProfileSheet({
  vendor,
  open,
  onOpenChange,
}: {
  vendor: Vendor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: updateVendorProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(vendorProfileQuery.queryKey, updated);
      toast.success("Profile updated");
      onOpenChange(false);
    },
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    /* blank optional fields become null so they can be cleared */
    mutation.mutate({
      name: readText(form, "name"),
      phone: readText(form, "phone"),
      contactName: readText(form, "contactName") || null,
      address: readText(form, "address") || null,
    });
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) mutation.reset();
      }}
      title="Edit profile"
      description="To change your emails, password or category, contact Mero Event."
      actions={
        <PendingButton type="submit" form={FORM_ID} pending={mutation.isPending}>
          Save changes
        </PendingButton>
      }
    >
      {/* remount on each open so the fields start from the saved profile */}
      <form key={String(open)} id={FORM_ID} onSubmit={onSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="profile-name">Business name</FieldLabel>
            <Input id="profile-name" name="name" required maxLength={NAME_MAX} defaultValue={vendor.name} />
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-phone">Phone</FieldLabel>
            <Input
              id="profile-phone"
              name="phone"
              type="tel"
              required
              maxLength={TEXT_MAX}
              defaultValue={vendor.phone}
            />
            <FieldDescription>Mero Event uses this number to reach you.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-contact">
              Contact person <OptionalHint />
            </FieldLabel>
            <Input
              id="profile-contact"
              name="contactName"
              maxLength={NAME_MAX}
              defaultValue={vendor.contactName ?? ""}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-address">
              Address <OptionalHint />
            </FieldLabel>
            <Input id="profile-address" name="address" maxLength={TEXT_MAX} defaultValue={vendor.address ?? ""} />
          </Field>
        </FieldGroup>
      </form>
    </FormSheet>
  );
}
