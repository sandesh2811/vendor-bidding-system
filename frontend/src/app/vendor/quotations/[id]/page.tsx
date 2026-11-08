import type { Metadata } from "next";
import { Suspense } from "react";
import { ReceivedQuotationView } from "@/features/quotations/components/received/received-quotation-view";
import { QuotationSkeleton } from "@/features/quotations/components/shared/quotation-skeleton";

export const metadata: Metadata = { title: "Request" };

/* the id is only known per request, so it's read inside Suspense (cacheComponents) */
export default function ReceivedQuotationPage({ params }: PageProps<"/vendor/quotations/[id]">) {
  return (
    <Suspense fallback={<QuotationSkeleton className="" />}>
      {params.then(({ id }) => (
        <ReceivedQuotationView id={id} />
      ))}
    </Suspense>
  );
}
