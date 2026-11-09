"use client";

import { useQuery } from "@tanstack/react-query";
import { PencilIcon } from "lucide-react";
import { LinkButton } from "@/components/layout/link-button";
import { AdminTopBar, PageTitle } from "@/components/layout/page-header";
import { QueryBoundary } from "@/components/layout/query-boundary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BidComparison } from "@/features/bids/components/admin/bid-comparison";
import { formatDate } from "@/lib/format";
import { quotationQuery } from "../../api/quotations.api";
import type { QuotationDetail } from "../../types";
import { EventTypeBadge } from "../shared/event-type-badge";
import { QuotationOverview } from "../shared/quotation-overview";
import { QuotationSkeleton } from "../shared/quotation-skeleton";
import { QuotationStatusBadge } from "../shared/quotation-status-badge";
import { ManagedPhotosSection } from "./managed-photos-section";
import { QuotationStatusActions } from "./quotation-status-actions";
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
  const editable = quotation.status !== "awarded" && quotation.status !== "cancelled";

  return (
    <>
      <PageTitle
        title={quotation.title}
        badge={
          <>
            <QuotationStatusBadge status={quotation.status} />
            <EventTypeBadge eventType={quotation.eventType} />
          </>
        }
        description={`Created ${formatDate(quotation.createdAt)}`}
        back={{ href: "/admin/quotations", label: "Back to quotations" }}
        actions={
          <>
            <QuotationStatusActions quotation={quotation} />
            {editable && (
              <LinkButton variant="outline" href={`/admin/quotations/${quotation.id}/edit`}>
                <PencilIcon data-icon="inline-start" />
                Edit
              </LinkButton>
            )}
          </>
        }
      />
      <Tabs defaultValue="details" className="px-4 pb-8 md:px-8">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="bids">Bids</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="pt-4">
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="flex min-w-0 flex-col gap-6">
              <QuotationOverview quotation={quotation} />
              <ManagedPhotosSection quotationId={quotation.id} photos={quotation.photos} />
            </div>
            <RecipientsCard
              quotationId={quotation.id}
              recipients={quotation.recipients}
              canSend={quotation.status === "draft" || quotation.status === "open"}
            />
          </div>
        </TabsContent>
        <TabsContent value="bids" className="min-w-0 pt-4">
          <BidComparison quotation={quotation} />
        </TabsContent>
      </Tabs>
    </>
  );
}
