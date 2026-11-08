"use client";

import { FileTextIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/data-table/data-table";
import { ListEmptyState } from "@/components/data-table/list-empty-state";
import { LinkButton } from "@/components/layout/link-button";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { useQuotationList } from "../../hooks/use-quotation-list";
import { quotationColumnClasses, quotationColumns, quotationSkeletons } from "./quotation-columns";
import { QuotationFilters } from "./quotation-filters";

const NEW_HREF = "/admin/quotations/new";

export function QuotationsView() {
  const router = useRouter();
  const list = useQuotationList();

  const newButton = (
    <LinkButton href={NEW_HREF}>
      <PlusIcon data-icon="inline-start" />
      New quotation
    </LinkButton>
  );

  return (
    <>
      <PageHeader
        section="Quotations"
        title="Quotations"
        description="Work requests sent to vendors for pricing, newest first."
        actions={newButton}
      />
      <div className="px-4 pb-8 md:px-8">
        <Card className="gap-0 py-0">
          <QuotationFilters {...list} />
          <DataTable
            query={list.query}
            columns={quotationColumns}
            pagination={list.pagination}
            onPaginationChange={list.setPagination}
            onRowClick={(quotation) => router.push(`/admin/quotations/${quotation.id}`)}
            columnClasses={quotationColumnClasses}
            skeletons={quotationSkeletons}
            errorTitle="Couldn't load quotations"
            empty={
              <ListEmptyState
                icon={FileTextIcon}
                noun="quotations"
                filtered={list.hasFilters}
                onClearFilters={list.clearFilters}
                title="No quotations yet"
                description="Create a work request and send it to vendors for pricing."
                action={newButton}
              />
            }
          />
        </Card>
      </div>
    </>
  );
}
