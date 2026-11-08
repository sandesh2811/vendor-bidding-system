"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { useCreateQuotation } from "../../hooks/use-create-quotation";
import type { QuotationFormValues } from "../../schemas/quotation-form.schema";
import { emptyQuotationForm, toCreateInput } from "../../utils/quotation-form-mapper";
import { FormActions } from "../form/form-actions";
import { QuotationForm } from "../form/quotation-form";
import { SendToCard } from "./send-to-card";
import { StagedPhotosSection } from "./staged-photos-section";

const FORM_ID = "create-quotation-form";
const LIST_HREF = "/admin/quotations";
const defaults = emptyQuotationForm();

export function CreateQuotationView() {
  const router = useRouter();
  const mutation = useCreateQuotation();
  const [photos, setPhotos] = useState<File[]>([]);
  const [vendorIds, setVendorIds] = useState<string[]>([]);

  /* the outcome toast comes from the hook; a partial failure still lands on the saved quotation */
  function onSubmit(values: QuotationFormValues) {
    mutation.mutate(
      { input: toCreateInput(values), photos, vendorIds },
      { onSuccess: ({ quotation }) => router.push(`${LIST_HREF}/${quotation.id}`) },
    );
  }

  return (
    <>
      <PageHeader
        section="Quotations"
        title="New quotation"
        description="Describe the event and what you need priced, then choose who to ask."
        back={{ href: LIST_HREF, label: "Back to quotations" }}
      />
      <div className="px-4 pb-8 md:px-8">
        <QuotationForm
          id={FORM_ID}
          defaultValues={defaults}
          onSubmit={onSubmit}
          aside={
            <SendToCard
              vendorIds={vendorIds}
              onChange={setVendorIds}
              actions={
                <FormActions
                  formId={FORM_ID}
                  cancelHref={LIST_HREF}
                  pending={mutation.isPending}
                  submitLabel={vendorIds.length ? "Create and send" : "Save draft"}
                />
              }
            />
          }
        >
          <StagedPhotosSection files={photos} onChange={setPhotos} />
        </QuotationForm>
      </div>
    </>
  );
}
