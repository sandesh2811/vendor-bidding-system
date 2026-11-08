"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Vendor } from "./vendors.api";
import { useUpdateVendor } from "./vendors.hooks";

export function ToggleVendorDialog({
  vendor,
  onOpenChange,
}: {
  vendor: Vendor | null;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = useUpdateVendor();

  /* keep the copy stable while the dialog animates closed */
  const [shown, setShown] = useState(vendor);
  if (vendor && vendor !== shown) setShown(vendor);

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
    <AlertDialog open={vendor !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {deactivating ? `Deactivate ${shown?.name}?` : `Reactivate ${shown?.name}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {deactivating
              ? "Their portal login stops working immediately and they won't receive new requests. You can reactivate them at any time."
              : "Their portal login will work again and they can receive new requests."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel>
          <Button
            variant={deactivating ? "destructive" : "default"}
            onClick={confirm}
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Spinner data-icon="inline-start" />}
            {deactivating ? "Deactivate" : "Reactivate"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
