"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormSheet } from "@/components/form/form-sheet";
import { PendingButton } from "@/components/form/pending-button";
import { TextField } from "@/components/form/text-field";
import { FieldGroup } from "@/components/ui/field";
import { updateVendorProfile, vendorProfileQuery } from "../../api/vendor-portal.api";
import { VENDOR_LIMITS } from "../../constants";
import {
  type VendorProfileFormInput,
  type VendorProfileFormValues,
  vendorProfileSchema,
} from "../../schemas/vendor-forms.schema";
import type { Vendor } from "../../types";

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

  /* blank optional fields become null so they can be cleared */
  function onSubmit(values: VendorProfileFormValues) {
    mutation.mutate({
      name: values.name,
      phone: values.phone,
      contactName: values.contactName || null,
      address: values.address || null,
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
      {/* mounted per opening, so the fields start from the saved profile */}
      {open && <ProfileForm vendor={vendor} onSubmit={onSubmit} />}
    </FormSheet>
  );
}

function ProfileForm({ vendor, onSubmit }: { vendor: Vendor; onSubmit: (values: VendorProfileFormValues) => void }) {
  const form = useForm<VendorProfileFormInput, unknown, VendorProfileFormValues>({
    resolver: zodResolver(vendorProfileSchema),
    mode: "onTouched",
    defaultValues: {
      name: vendor.name,
      phone: vendor.phone,
      contactName: vendor.contactName ?? "",
      address: vendor.address ?? "",
    },
  });

  return (
    <FormProvider {...form}>
      <form id={FORM_ID} noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <TextField<VendorProfileFormInput> name="name" label="Business name" maxLength={NAME_MAX} />
          <TextField<VendorProfileFormInput>
            name="phone"
            label="Phone"
            type="tel"
            maxLength={TEXT_MAX}
            description="Mero Event uses this number to reach you."
          />
          <TextField<VendorProfileFormInput> name="contactName" label="Contact person" optional maxLength={NAME_MAX} />
          <TextField<VendorProfileFormInput> name="address" label="Address" optional maxLength={TEXT_MAX} />
        </FieldGroup>
      </form>
    </FormProvider>
  );
}
