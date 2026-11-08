"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { type DefaultValues, FormProvider, useForm } from "react-hook-form";
import {
  type QuotationFormInput,
  type QuotationFormValues,
  quotationFormSchema,
} from "../../schemas/quotation-form.schema";
import { EventDetailsSection } from "./event-details-section";
import { ItemsSection } from "./items-section";

/**
 * Event details and items, shared by the create and edit pages. Pages add their own sections
 * (`children` below the items, `aside` in the side column) and the submit buttons, linked by `id`.
 */
export function QuotationForm({
  id,
  defaultValues,
  onSubmit,
  children,
  aside,
}: {
  id: string;
  defaultValues: DefaultValues<QuotationFormInput>;
  onSubmit: (values: QuotationFormValues) => void;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  const form = useForm<QuotationFormInput, unknown, QuotationFormValues>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues,
    mode: "onTouched",
  });

  return (
    <FormProvider {...form}>
      <form
        id={id}
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
      >
        <div className="flex min-w-0 flex-col gap-6">
          <EventDetailsSection />
          <ItemsSection />
          {children}
        </div>
        {aside && <aside className="flex flex-col gap-6 lg:sticky lg:top-6">{aside}</aside>}
      </form>
    </FormProvider>
  );
}
