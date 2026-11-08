"use client";

import { toast } from "sonner";
import { ConfirmDialog } from "@/components/layout/confirm-dialog";
import { useRetainedValue } from "@/hooks/use-retained-value";
import { useUpdateVendor } from "../../hooks/use-vendor-mutations";
import type { Vendor } from "../../types";

export function ToggleVendorDialog({
  vendor,
  onOpenChange,
}: {
  vendor: Vendor | null;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useUpdateVendor();
  /* keep the copy stable while the dialog animates closed */
  const shown = useRetainedValue(vendor);
  const deactivating = shown?.isActive ?? true;

  function confirm() {
    if (!shown) return;
    mutation.mutate(
      { id: shown.id, input: { isActive: !shown.isActive } },
      {
        onSuccess: (updated) => {
          toast.success(updated.isActive ? `${updated.name} reactivated` : `${updated.name} deactivated`);
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <ConfirmDialog
      open={vendor !== null}
      onOpenChange={onOpenChange}
      title={deactivating ? `Deactivate ${shown?.name}?` : `Reactivate ${shown?.name}?`}
      description={
        deactivating
          ? "Their portal login stops working immediately and they won't receive new requests. You can reactivate them at any time."
          : "Their portal login will work again and they can receive new requests."
      }
      confirmLabel={deactivating ? "Deactivate" : "Reactivate"}
      destructive={deactivating}
      pending={mutation.isPending}
      onConfirm={confirm}
    />
  );
}
