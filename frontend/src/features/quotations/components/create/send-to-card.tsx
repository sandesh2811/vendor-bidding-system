"use client";

import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { VendorPicker } from "../shared/vendor-picker";

/* who receives the new quotation, plus the page's submit buttons */
export function SendToCard({
  vendorIds,
  onChange,
  actions,
}: {
  vendorIds: string[];
  onChange: (vendorIds: string[]) => void;
  actions: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Send to</CardTitle>
        <CardDescription>Vendors see the request once it and its photos are saved.</CardDescription>
      </CardHeader>
      <CardContent>
        <Field>
          <FieldLabel htmlFor="send-to-vendors" className="sr-only">
            Vendors
          </FieldLabel>
          <VendorPicker id="send-to-vendors" value={vendorIds} onChange={onChange} />
          <FieldDescription>
            {vendorIds.length
              ? `${vendorIds.length} vendor${vendorIds.length === 1 ? "" : "s"} selected.`
              : "Leave empty to save a draft and send it later."}
          </FieldDescription>
        </Field>
      </CardContent>
      <CardFooter className="flex-wrap justify-end gap-2 border-t">{actions}</CardFooter>
    </Card>
  );
}
