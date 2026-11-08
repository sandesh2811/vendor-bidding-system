import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminTopBar } from "@/components/layout/page-header";
import { EditQuotationView } from "@/features/quotations/components/edit/edit-quotation-view";
import { QuotationSkeleton } from "@/features/quotations/components/shared/quotation-skeleton";

export const metadata: Metadata = { title: "Edit quotation" };

export default function EditQuotationPage({ params }: PageProps<"/admin/quotations/[id]/edit">) {
  return (
    <Suspense
      fallback={
        <>
          <AdminTopBar section="Quotations" />
          <QuotationSkeleton />
        </>
      }
    >
      {params.then(({ id }) => (
        <EditQuotationView id={id} />
      ))}
    </Suspense>
  );
}
