"use client";

import { useWatch } from "react-hook-form";
import { DatePicker } from "@/components/form/date-picker";
import { FormField } from "@/components/form/form-field";
import { TextField } from "@/components/form/text-field";
import { SectionCard } from "@/components/layout/section-card";
import { FieldGroup } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { businessToday } from "@/lib/dates";
import { EVENT_TYPE_LABELS, EVENT_TYPES, QUOTATION_LIMITS as L } from "../../constants";
import type { QuotationFormInput } from "../../schemas/quotation-form.schema";

type Values = QuotationFormInput;

export function EventDetailsSection() {
  const eventDate = useWatch<Values, "eventDate">({ name: "eventDate" });
  const today = businessToday();

  return (
    <SectionCard title="Event" description="What vendors need to know to price the work.">
      <FieldGroup>
        <TextField<Values> name="title" label="Title" maxLength={L.TITLE_MAX} placeholder="Sharma wedding reception" />

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField<Values, "eventType"> name="eventType" label="Event type">
            {({ field, id, invalid }) => (
              <Select items={EVENT_TYPE_LABELS} value={field.value ?? null} onValueChange={field.onChange}>
                <SelectTrigger id={id} aria-invalid={invalid} onBlur={field.onBlur} className="w-full">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {EVENT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
          <TextField<Values> name="guestCount" label="Guests" optional inputMode="numeric" placeholder="300" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField<Values, "eventDate"> name="eventDate" label="Event date">
            {({ field, id, invalid }) => (
              <DatePicker id={id} value={field.value} onChange={field.onChange} min={today} invalid={invalid} />
            )}
          </FormField>
          <FormField<Values, "responseDeadline"> name="responseDeadline" label="Respond by" optional description="Last day vendors can bid.">
            {({ field, id, invalid }) => (
              <DatePicker
                id={id}
                value={field.value}
                onChange={field.onChange}
                min={today}
                max={eventDate || undefined}
                placeholder="No deadline"
                invalid={invalid}
              />
            )}
          </FormField>
        </div>

        <TextField<Values> name="location" label="Location" maxLength={L.TEXT_MAX} placeholder="Hotel Yak & Yeti, Kathmandu" />
        <TextField<Values>
          name="description"
          label="Description"
          optional
          multiline
          rows={4}
          maxLength={L.DESCRIPTION_MAX}
          placeholder="Theme, timings, access, anything vendors should plan around"
        />
      </FieldGroup>
    </SectionCard>
  );
}
