"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LockIcon } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import { LinkButton } from "@/components/layout/link-button";
import { AdminTopBar, PageTitle } from "@/components/layout/page-header";
import { QueryBoundary } from "@/components/layout/query-boundary";
import { quotationQuery } from "../../api/quotations.api";
import { useUpdateQuotation } from "../../hooks/use-quotation-mutations";
import type { QuotationFormValues } from "../../schemas/quotation-form.schema";
import type { QuotationDetail } from "../../types";
import { toFormValues, toUpdateInput } from "../../utils/quotation-form-mapper";
import { FormActions } from "../form/form-actions";
import { QuotationForm } from "../form/quotation-form";
import { QuotationSkeleton } from "../shared/quotation-skeleton";

const FORM_ID = "edit-quotation-form";

export function EditQuotationView({ id }: { id: string }) {
  const query = useQuery(quotationQuery(id));

  return (
    <>
      <AdminTopBar section="Quotations" />
      <QueryBoundary query={query} errorTitle="Couldn't load this quotation" fallback={<QuotationSkeleton />}>
        {(quotation) => (quotation.status === "draft" ? <EditForm quotation={quotation} /> : <Locked quotation={quotation} />)}
      </QueryBoundary>
    </>
  );
}

/* once sent, details and items are locked; the deadline is changed from the quotation page */
function Locked({ quotation }: { quotation: QuotationDetail }) {
  const detailHref = `/admin/quotations/${quotation.id}`;
  return (
    <EmptyState
      icon={LockIcon}
      title="This quotation can no longer be edited"
      description="Once sent, only the response deadline can change. To change anything else, cancel it and create a new one."
      action={
        <LinkButton variant="outline" href={detailHref}>
          Back to quotation
        </LinkButton>
      }
      className="py-16"
    />
  );
}

function EditForm({ quotation }: { quotation: QuotationDetail }) {
  const router = useRouter();
  const mutation = useUpdateQuotation(quotation.id);
  const detailHref = `/admin/quotations/${quotation.id}`;

  /* only changed fields are sent; nothing changed means nothing to save */
  function onSubmit(values: QuotationFormValues) {
    const changes = toUpdateInput(values, quotation);
    if (!Object.keys(changes).length) return router.push(detailHref);

    mutation.mutate(changes, {
      onSuccess: (updated) => {
        toast.success(`${updated.title} updated`);
        router.push(detailHref);
      },
    });
  }

  return (
    <>
      <PageTitle
        title={`Edit ${quotation.title}`}
        description="Vendors who already have this request see the changes."
        back={{ href: detailHref, label: "Back to quotation" }}
      />
      <div className="px-4 pb-8 md:px-8">
        {/* keyed on the saved version, so a refetch after someone else's edit resets the form */}
        <QuotationForm key={quotation.updatedAt} id={FORM_ID} defaultValues={toFormValues(quotation)} onSubmit={onSubmit}>
          <div className="flex justify-end gap-2">
            <FormActions formId={FORM_ID} cancelHref={detailHref} pending={mutation.isPending} submitLabel="Save changes" />
          </div>
        </QuotationForm>
      </div>
    </>
  );
}
