"use client";

import { HandCoinsIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/data-table/data-table";
import { EmptyState } from "@/components/layout/empty-state";
import { PageTitle } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { useVendorBookingList } from "../../hooks/use-booking-list";
import { bookingColumnClasses, bookingColumns, bookingSkeletons } from "../admin/list/booking-columns";

/* the vendor sees the same columns minus its own name */
const vendorColumns = bookingColumns.filter((column) => column.id !== "vendor");

export function VendorBookingsView() {
  const router = useRouter();
  const list = useVendorBookingList();

  return (
    <>
      <PageTitle
        title="Bookings"
        description="Requests you won, with what Mero Event has paid and what's pending."
        className="px-0 pt-0 pb-6"
      />
      <Card className="gap-0 py-0">
        <DataTable
          query={list.query}
          columns={vendorColumns}
          pagination={list.pagination}
          onPaginationChange={list.setPagination}
          onRowClick={(booking) => router.push(`/vendor/bookings/${booking.id}`)}
          columnClasses={bookingColumnClasses}
          skeletons={bookingSkeletons}
          errorTitle="Couldn't load your bookings"
          empty={
            <EmptyState
              icon={HandCoinsIcon}
              title="No bookings yet"
              description="When Mero Event selects one of your bids, the booking shows up here."
            />
          }
        />
      </Card>
    </>
  );
}
