import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminTopBar } from "@/components/layout/page-header";
import { QuotationDetailView } from "@/features/quotations/components/detail/quotation-detail-view";
import { QuotationSkeleton } from "@/features/quotations/components/shared/quotation-skeleton";

export const metadata: Metadata = { title: "Quotation" };

/* the id is only known per request, so it's read inside Suspense (cacheComponents) */
export default function QuotationPage({ params }: PageProps<"/admin/quotations/[id]">) {
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
        <QuotationDetailView id={id} />
      ))}
    </Suspense>
  );
}
