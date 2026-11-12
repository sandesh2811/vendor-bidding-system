"use client";

import { PlusIcon, StoreIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { ListEmptyState } from "@/components/data-table/list-empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useVendorList } from "../../hooks/use-vendor-list";
import type { Vendor } from "../../types";
import { CreateVendorSheet } from "../form/create-vendor-sheet";
import { EditVendorSheet } from "../form/edit-vendor-sheet";
import { ToggleVendorDialog } from "../shared/toggle-vendor-dialog";
import { PaymentDetailsSheet } from "./payment-details-sheet";
import { vendorColumnClasses, vendorColumns, vendorSkeletons } from "./vendor-columns";
import { VendorFilters } from "./vendor-filters";

export function VendorsView() {
  const list = useVendorList();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [toggling, setToggling] = useState<Vendor | null>(null);
  const [viewingPayment, setViewingPayment] = useState<Vendor | null>(null);

  /* setState functions are stable, so columns are built once */
  const columns = useMemo(() => vendorColumns({ onEdit: setEditing, onPaymentDetails: setViewingPayment, onToggleActive: setToggling }), []);

  const addButton = (
    <Button size="lg" className="px-4 has-data-[icon=inline-start]:pl-3" onClick={() => setCreating(true)}>
      <PlusIcon data-icon="inline-start" />
      Add vendor
    </Button>
  );

  return (
    <>
      <PageHeader
        section="Vendors"
        title="Vendors"
        description="Partners who receive work requests and bid on events."
        actions={addButton}
      />

      <div className="px-4 pb-8 md:px-8">
        <Card className="gap-0 py-0">
          <VendorFilters {...list} />
          <DataTable
            query={list.query}
            columns={columns}
            pagination={list.pagination}
            onPaginationChange={list.setPagination}
            onRowClick={setEditing}
            columnClasses={vendorColumnClasses}
            skeletons={vendorSkeletons}
            errorTitle="Couldn't load vendors"
            empty={
              <ListEmptyState
                icon={StoreIcon}
                noun="vendors"
                filtered={list.hasFilters}
                onClearFilters={list.clearFilters}
                title="No vendors yet"
                description="Add your first vendor to start sending work requests."
                action={addButton}
              />
            }
          />
        </Card>
      </div>

      <CreateVendorSheet open={creating} onOpenChange={setCreating} />
      <EditVendorSheet
        vendor={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onToggleActive={(vendor) => {
          setEditing(null);
          setToggling(vendor);
        }}
      />
      <ToggleVendorDialog vendor={toggling} onOpenChange={(open) => !open && setToggling(null)} />
      <PaymentDetailsSheet vendor={viewingPayment} onOpenChange={(open) => !open && setViewingPayment(null)} />
    </>
  );
}
