"use client";

import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
import { EMAIL_MAX, NAME_MAX, readText, readVendorDetails, VendorDetailsFields } from "./vendor-details-fields";
import { useCreateVendor } from "./vendors.hooks";

/* mirrors PASSWORD_MIN_LENGTH / PASSWORD_MAX_LENGTH in the backend */
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;
const FORM_ID = "create-vendor-form";

export function CreateVendorSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const mutation = useCreateVendor();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const details = readVendorDetails(form);
    mutation.mutate(
      {
        ...details,
        login: {
          name: readText(form, "loginName") || details.contactName || details.name,
          email: readText(form, "loginEmail"),
          password: String(form.get("loginPassword") ?? ""),
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) mutation.reset();
      }}
    >
      <SheetContent className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="text-base">Add vendor</SheetTitle>
          <SheetDescription>Creates the vendor and their portal login in one step.</SheetDescription>
        </SheetHeader>

        <form id={FORM_ID} onSubmit={onSubmit} className="flex-1 overflow-y-auto px-6 py-6">
          <FieldGroup className="gap-8">
            <VendorDetailsFields />
            <FieldSeparator />
            <FieldSet>
              <FieldLegend>Portal login</FieldLegend>
              <FieldDescription>Share these with the vendor so they can see requests and submit bids.</FieldDescription>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="login-name">
                    Account holder <span className="font-normal text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Input id="login-name" name="loginName" maxLength={NAME_MAX} placeholder="Defaults to contact person" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="login-email">Login email</FieldLabel>
                  <Input id="login-email" name="loginEmail" type="email" required maxLength={EMAIL_MAX} autoComplete="off" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="login-password">Temporary password</FieldLabel>
                  <Input
                    id="login-password"
                    name="loginPassword"
                    type="password"
                    required
                    minLength={PASSWORD_MIN}
                    maxLength={PASSWORD_MAX}
                    autoComplete="new-password"
                  />
                  <FieldDescription>At least {PASSWORD_MIN} characters.</FieldDescription>
                </Field>
              </FieldGroup>
            </FieldSet>
          </FieldGroup>
        </form>

        <SheetFooter className="border-t px-6 py-4">
          <div className="flex justify-end gap-2">
            <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
            <Button type="submit" form={FORM_ID} disabled={mutation.isPending}>
              {mutation.isPending && <Spinner data-icon="inline-start" />}
              Add vendor
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
