"use client";

import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { formatDate } from "@/lib/format";
import { readVendorDetails, VendorDetailsFields } from "./vendor-details-fields";
import { VendorStatusBadge } from "./vendor-status-badge";
import type { Vendor } from "./vendors.api";
import { useUpdateVendor } from "./vendors.hooks";

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

  /* keep rendering the last vendor while the sheet animates closed */
  const [shown, setShown] = useState(vendor);
  if (vendor && vendor !== shown) setShown(vendor);

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
    <Sheet
      open={vendor !== null}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) mutation.reset();
      }}
    >
      <SheetContent className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        {shown && (
          <>
            <SheetHeader className="border-b px-6 py-5">
              <div className="flex items-center gap-2 pr-8">
                <SheetTitle className="truncate text-base">{shown.name}</SheetTitle>
                <VendorStatusBadge isActive={shown.isActive} />
              </div>
              <SheetDescription>Added {formatDate(shown.createdAt)}</SheetDescription>
            </SheetHeader>

            <form key={shown.id} id={FORM_ID} onSubmit={onSubmit} className="flex-1 overflow-y-auto px-6 py-6">
              <FieldGroup className="gap-8">
                <VendorDetailsFields vendor={shown} />
              </FieldGroup>
            </form>

            <SheetFooter className="border-t px-6 py-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={shown.isActive ? "destructive" : "outline"}
                  onClick={() => onToggleActive(shown)}
                  className="mr-auto"
                >
                  {shown.isActive ? "Deactivate" : "Reactivate"}
                </Button>
                <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
                <Button type="submit" form={FORM_ID} disabled={mutation.isPending}>
                  {mutation.isPending && <Spinner data-icon="inline-start" />}
                  Save changes
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
