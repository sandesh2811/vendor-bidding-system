"use client";

import { FormField } from "@/components/form/form-field";
import { TextField } from "@/components/form/text-field";
import { FieldDescription, FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORY_LABELS, VENDOR_CATEGORIES, VENDOR_LIMITS } from "../../constants";
import type { VendorDetailsInput } from "../../schemas/vendor-forms.schema";

const { NAME_MAX, TEXT_MAX, EMAIL_MAX, NOTES_MAX } = VENDOR_LIMITS;

/* business + internal fields shared by the create and edit forms; must sit inside their FormProvider */
export function VendorDetailsFields() {
  return (
    <>
      <FieldSet>
        <FieldLegend>Business</FieldLegend>
        <FieldDescription>How the vendor appears in requests and bookings.</FieldDescription>
        <FieldGroup>
          <TextField<VendorDetailsInput>
            name="name"
            label="Business name"
            maxLength={NAME_MAX}
            placeholder="Everest Sound & Lights"
          />
          <div className="grid items-start gap-5 sm:grid-cols-2">
            <FormField<VendorDetailsInput, "category"> name="category" label="Category">
              {({ field, id, invalid }) => (
                <Select items={CATEGORY_LABELS} value={field.value ?? null} onValueChange={field.onChange}>
                  <SelectTrigger id={id} aria-invalid={invalid} onBlur={field.onBlur} className="w-full">
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
              )}
            </FormField>
            <TextField<VendorDetailsInput>
              name="phone"
              label="Phone"
              type="tel"
              autoComplete="off"
              maxLength={TEXT_MAX}
              placeholder="98XXXXXXXX"
            />
          </div>
          <div className="grid items-start gap-5 sm:grid-cols-2">
            <TextField<VendorDetailsInput> name="contactName" label="Contact person" optional maxLength={NAME_MAX} />
            <TextField<VendorDetailsInput>
              name="email"
              label="Business email"
              optional
              type="email"
              autoComplete="off"
              maxLength={EMAIL_MAX}
            />
          </div>
          <TextField<VendorDetailsInput>
            name="address"
            label="Address"
            optional
            maxLength={TEXT_MAX}
            placeholder="Baneshwor, Kathmandu"
          />
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Internal notes</FieldLegend>
        <FieldDescription>Only Mero Event staff can see these.</FieldDescription>
        <TextField<VendorDetailsInput>
          name="notes"
          label="Notes"
          hideLabel
          multiline
          rows={3}
          maxLength={NOTES_MAX}
          placeholder="Pricing tier, reliability, past events…"
        />
      </FieldSet>
    </>
  );
}
