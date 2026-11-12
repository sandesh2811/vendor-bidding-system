"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useRetainedValue } from "@/hooks/use-retained-value";
import type { Vendor } from "../../types";
import { VendorPaymentDetails } from "../shared/vendor-payment-details";

/* read-only: the vendor maintains its payment details in the portal */
export function PaymentDetailsSheet({
  vendor,
  onOpenChange,
}: {
  vendor: Vendor | null;
  onOpenChange: (open: boolean) => void;
}) {
  /* keeps the content on screen while the sheet animates out */
  const shown = useRetainedValue(vendor);

  return (
    <Sheet open={vendor !== null} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="truncate pr-8 text-base">{shown?.name}</SheetTitle>
          <SheetDescription>Payment details, as the vendor entered them in its portal.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-6">{shown && <VendorPaymentDetails vendorId={shown.id} />}</div>
      </SheetContent>
    </Sheet>
  );
}
