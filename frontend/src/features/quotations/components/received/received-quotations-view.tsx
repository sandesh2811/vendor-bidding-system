"use client";

import { InboxIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/data-table/data-table";
import { EmptyState } from "@/components/layout/empty-state";
import { PageTitle } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { VendorSummaryCards } from "@/features/vendors/components/portal/vendor-summary-cards";
import { useReceivedList } from "../../hooks/use-received-list";
import { receivedColumnClasses, receivedColumns, receivedSkeletons } from "./received-columns";

/* vendor portal home: the requests Mero Event has sent this vendor */
export function ReceivedQuotationsView() {
  const router = useRouter();
  const list = useReceivedList();

  return (
    <>
      <PageTitle
        title="Requests"
        description="Work requests from Mero Event, most recent first."
        className="px-0 pt-0 pb-6"
      />
      <VendorSummaryCards />
      <Card className="gap-0 py-0">
        <DataTable
          query={list.query}
          columns={receivedColumns}
          pagination={list.pagination}
          onPaginationChange={list.setPagination}
          onRowClick={(quotation) => router.push(`/vendor/quotations/${quotation.id}`)}
          columnClasses={receivedColumnClasses}
          skeletons={receivedSkeletons}
          errorTitle="Couldn't load your requests"
          empty={
            <EmptyState
              icon={InboxIcon}
              title="No requests yet"
              description="When Mero Event sends you a request to quote, you'll see it here."
            />
          }
        />
      </Card>
    </>
  );
}
