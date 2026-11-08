"use client";

import { useQuery } from "@tanstack/react-query";
import { PageTitle } from "@/components/layout/page-header";
import { QueryBoundary } from "@/components/layout/query-boundary";
import { formatDate } from "@/lib/format";
import { receivedPhotoUrl, receivedQuotationQuery } from "../../api/received-quotations.api";
import { EventTypeBadge } from "../shared/event-type-badge";
import { PhotosSection } from "../shared/photos-section";
import { QuotationOverview } from "../shared/quotation-overview";
import { QuotationSkeleton } from "../shared/quotation-skeleton";

/* one request as the vendor sees it: event, items and photos (read-only) */
export function ReceivedQuotationView({ id }: { id: string }) {
  const query = useQuery(receivedQuotationQuery(id));

  return (
    <QueryBoundary query={query} errorTitle="Couldn't load this request" fallback={<QuotationSkeleton className="" />}>
      {(quotation) => (
        <>
          <PageTitle
            title={quotation.title}
            badge={<EventTypeBadge eventType={quotation.eventType} />}
            description={`Received ${formatDate(quotation.receivedAt)}`}
            back={{ href: "/vendor", label: "Back to requests" }}
            className="px-0 pt-0 pb-6"
          />
          <div className="flex flex-col gap-6">
            <QuotationOverview quotation={quotation} />
            <PhotosSection
              photos={quotation.photos.map((photo) => ({
                id: photo.id,
                src: receivedPhotoUrl(photo),
                name: photo.originalName,
              }))}
            />
          </div>
        </>
      )}
    </QueryBoundary>
  );
}
