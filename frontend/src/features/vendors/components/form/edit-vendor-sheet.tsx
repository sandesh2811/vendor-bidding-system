"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormSheet } from "@/components/form/form-sheet";
import { PendingButton } from "@/components/form/pending-button";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { useRetainedValue } from "@/hooks/use-retained-value";
import { formatDate } from "@/lib/format";
import { useUpdateVendor } from "../../hooks/use-vendor-mutations";
import type { Vendor } from "../../types";
import {
  type VendorDetailsInput,
  type VendorDetailsValues,
  toVendorDetails,
  vendorDetailsDefaults,
  vendorDetailsSchema,
} from "../../schemas/vendor-forms.schema";
import { VendorStatusBadge } from "../shared/vendor-status-badge";
import { VendorDetailsFields } from "./vendor-details-fields";

const FORM_ID = "edit-vendor-form";

export function EditVendorSheet({
  vendor,
  onOpenChange,
  onToggleActive,
}: {
  vendor: Vendor | null;
  onOpenChange: (open: boolean) => void;
  onToggleActive: (vendor: Vendor) => void;
}) {
  const mutation = useUpdateVendor();
  const shown = useRetainedValue(vendor);

  function onSubmit(values: VendorDetailsValues) {
    if (!shown) return;
    mutation.mutate(
      { id: shown.id, input: toVendorDetails(values) },
      {
        onSuccess: (updated) => {
          toast.success(`${updated.name} updated`);
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <FormSheet
      open={vendor !== null}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) mutation.reset();
      }}
      title={shown?.name ?? ""}
      badge={shown && <VendorStatusBadge isActive={shown.isActive} />}
      description={shown && `Added ${formatDate(shown.createdAt)}`}
      footerStart={
        shown && (
          <Button variant={shown.isActive ? "destructive" : "outline"} onClick={() => onToggleActive(shown)}>
            {shown.isActive ? "Deactivate" : "Reactivate"}
          </Button>
        )
      }
      actions={
        <PendingButton type="submit" form={FORM_ID} pending={mutation.isPending}>
          Save changes
        </PendingButton>
      }
    >
      {/* the sheet stays mounted so it can animate; the form appears once there is a vendor */}
      {shown && <EditVendorForm key={shown.id} vendor={shown} onSubmit={onSubmit} />}
    </FormSheet>
  );
}

function EditVendorForm({ vendor, onSubmit }: { vendor: Vendor; onSubmit: (values: VendorDetailsValues) => void }) {
  const form = useForm<VendorDetailsInput, unknown, VendorDetailsValues>({
    resolver: zodResolver(vendorDetailsSchema),
    mode: "onTouched",
    defaultValues: vendorDetailsDefaults(vendor),
  });

  return (
    <FormProvider {...form}>
      <form id={FORM_ID} noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup className="gap-8">
          <VendorDetailsFields />
        </FieldGroup>
      </form>
    </FormProvider>
  );
}
