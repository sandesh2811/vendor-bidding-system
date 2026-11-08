"use client";

import type { FormEvent } from "react";
import { toast } from "sonner";
import { FormSheet } from "@/components/form/form-sheet";
import { PendingButton } from "@/components/form/pending-button";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { useRetainedValue } from "@/hooks/use-retained-value";
import { formatDate } from "@/lib/format";
import { useUpdateVendor } from "../../hooks/use-vendor-mutations";
import type { Vendor } from "../../types";
import { readVendorDetails } from "../../utils/vendor-form-data";
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

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!shown) return;
    mutation.mutate(
      { id: shown.id, input: readVendorDetails(new FormData(e.currentTarget)) },
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
      {shown && (
        <form key={shown.id} id={FORM_ID} onSubmit={onSubmit}>
          <FieldGroup className="gap-8">
            <VendorDetailsFields vendor={shown} />
          </FieldGroup>
        </form>
      )}
    </FormSheet>
  );
}
