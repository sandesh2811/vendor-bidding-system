"use client";

import { useQuery } from "@tanstack/react-query";
import { PencilIcon } from "lucide-react";
import { LinkButton } from "@/components/layout/link-button";
import { AdminTopBar, PageTitle } from "@/components/layout/page-header";
import { QueryBoundary } from "@/components/layout/query-boundary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { quotationBidsQuery } from "@/features/bids/api/bids.api";
import { BidComparison } from "@/features/bids/components/admin/bid-comparison";
import { formatDate } from "@/lib/format";
import { quotationQuery } from "../../api/quotations.api";
import type { QuotationDetail } from "../../types";
import { EventTypeBadge } from "../shared/event-type-badge";
import { QuotationOverview } from "../shared/quotation-overview";
import { QuotationSkeleton } from "../shared/quotation-skeleton";
import { QuotationStatusBadge } from "../shared/quotation-status-badge";
import { ChangeDeadlineDialog } from "./change-deadline-dialog";
import { ManagedPhotosSection } from "./managed-photos-section";
import { QuotationStatusActions } from "./quotation-status-actions";
import { RecipientsCard } from "./recipients-card";

/* underline tabs: roomier than the default pill, with the active line sitting on the list's bottom border */
const TAB = "h-10 flex-none px-1 group-data-horizontal/tabs:after:bottom-[-1px]";

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
  /* a draft is fully editable; once sent, only the deadline (until awarded or cancelled) */
  const draft = quotation.status === "draft";
  const deadlineOnly = quotation.status === "open" || quotation.status === "closed";
  /* shared with the Bids tab's query, so the count costs nothing extra once that tab is opened */
  const { data: bids } = useQuery({ ...quotationBidsQuery(quotation.id), enabled: quotation.recipients.length > 0 });

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
            {deadlineOnly && <ChangeDeadlineDialog quotation={quotation} />}
            {draft && (
              <LinkButton variant="outline" href={`/admin/quotations/${quotation.id}/edit`}>
                <PencilIcon data-icon="inline-start" />
                Edit
              </LinkButton>
            )}
          </>
        }
      />
      <Tabs defaultValue="details" className="gap-0 px-4 pb-10 md:px-10">
        <TabsList variant="line" className="h-auto! w-full justify-start gap-4 border-b p-0">
          <TabsTrigger value="details" className={TAB}>
            Details
          </TabsTrigger>
          <TabsTrigger value="bids" className={TAB}>
            Bids
            {bids && (
              <span className="rounded-full bg-muted px-1.5 text-xs font-normal text-muted-foreground tabular-nums">
                {bids.length}/{quotation.recipients.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="pt-6">
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="flex min-w-0 flex-col gap-6">
              <QuotationOverview quotation={quotation} />
              <ManagedPhotosSection quotationId={quotation.id} photos={quotation.photos} canRemove={draft} />
            </div>
            <RecipientsCard
              quotationId={quotation.id}
              recipients={quotation.recipients}
              canSend={quotation.status === "draft" || quotation.status === "open"}
            />
          </div>
        </TabsContent>
        <TabsContent value="bids" className="min-w-0 pt-6">
          <BidComparison quotation={quotation} />
        </TabsContent>
      </Tabs>
    </>
  );
}
