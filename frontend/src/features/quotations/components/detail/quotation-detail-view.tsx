"use client";

import { useQuery } from "@tanstack/react-query";
import { PencilIcon } from "lucide-react";
import { LinkButton } from "@/components/layout/link-button";
import { AdminTopBar, PageTitle } from "@/components/layout/page-header";
import { QueryBoundary } from "@/components/layout/query-boundary";
import { formatDate } from "@/lib/format";
import { quotationQuery } from "../../api/quotations.api";
import type { QuotationDetail } from "../../types";
import { EventTypeBadge } from "../shared/event-type-badge";
import { QuotationOverview } from "../shared/quotation-overview";
import { QuotationSkeleton } from "../shared/quotation-skeleton";
import { ManagedPhotosSection } from "./managed-photos-section";
import { RecipientsCard } from "./recipients-card";

export function QuotationDetailView({ id }: { id: string }) {
  const query = useQuery(quotationQuery(id));

  return (
    <>
      <AdminTopBar section="Quotations" />
      <QueryBoundary query={query} errorTitle="Couldn't load this quotation" fallback={<QuotationSkeleton />}>
        {(quotation) => <QuotationDetailContent quotation={quotation} />}
      </QueryBoundary>
    </>
  );
}

function QuotationDetailContent({ quotation }: { quotation: QuotationDetail }) {
  return (
    <>
      <PageTitle
        title={quotation.title}
        badge={<EventTypeBadge eventType={quotation.eventType} />}
        description={`Created ${formatDate(quotation.createdAt)}`}
        back={{ href: "/admin/quotations", label: "Back to quotations" }}
        actions={
          <LinkButton variant="outline" href={`/admin/quotations/${quotation.id}/edit`}>
            <PencilIcon data-icon="inline-start" />
            Edit
          </LinkButton>
        }
      />
      <div className="grid items-start gap-6 px-4 pb-8 md:px-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <QuotationOverview quotation={quotation} />
          <ManagedPhotosSection quotationId={quotation.id} photos={quotation.photos} />
        </div>
        <RecipientsCard quotationId={quotation.id} recipients={quotation.recipients} />
      </div>
    </>
  );
}
