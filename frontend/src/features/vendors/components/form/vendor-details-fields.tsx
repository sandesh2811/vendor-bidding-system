"use client";

import { OptionalHint } from "@/components/form/optional-hint";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_LABELS, VENDOR_CATEGORIES, VENDOR_LIMITS } from "../../constants";
import type { Vendor } from "../../types";

const { NAME_MAX, TEXT_MAX, EMAIL_MAX } = VENDOR_LIMITS;

/* business + internal fields shared by the create and edit forms; uncontrolled, read back with readVendorDetails */
export function VendorDetailsFields({ vendor }: { vendor?: Vendor }) {
  return (
    <>
      <FieldSet>
        <FieldLegend>Business</FieldLegend>
        <FieldDescription>How the vendor appears in requests and bookings.</FieldDescription>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="vendor-name">Business name</FieldLabel>
            <Input id="vendor-name" name="name" required maxLength={NAME_MAX} defaultValue={vendor?.name} placeholder="Everest Sound & Lights" />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="vendor-category">Category</FieldLabel>
              <Select name="category" required items={CATEGORY_LABELS} defaultValue={vendor?.category ?? null}>
                <SelectTrigger id="vendor-category" className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {VENDOR_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="vendor-phone">Phone</FieldLabel>
              <Input id="vendor-phone" name="phone" type="tel" required maxLength={TEXT_MAX} defaultValue={vendor?.phone} placeholder="98XXXXXXXX" />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="vendor-contact">
                Contact person <OptionalHint />
              </FieldLabel>
              <Input id="vendor-contact" name="contactName" maxLength={NAME_MAX} defaultValue={vendor?.contactName ?? ""} />
            </Field>
            <Field>
              <FieldLabel htmlFor="vendor-email">
                Business email <OptionalHint />
              </FieldLabel>
              <Input id="vendor-email" name="email" type="email" maxLength={EMAIL_MAX} defaultValue={vendor?.email ?? ""} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="vendor-address">
              Address <OptionalHint />
            </FieldLabel>
            <Input id="vendor-address" name="address" maxLength={TEXT_MAX} defaultValue={vendor?.address ?? ""} placeholder="Baneshwor, Kathmandu" />
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Internal notes</FieldLegend>
        <FieldDescription>Only Mero Event staff can see these.</FieldDescription>
        <Field>
          <FieldLabel htmlFor="vendor-notes" className="sr-only">
            Notes
          </FieldLabel>
          <Textarea id="vendor-notes" name="notes" rows={3} defaultValue={vendor?.notes ?? ""} placeholder="Pricing tier, reliability, past events…" />
        </Field>
      </FieldSet>
    </>
  );
}

