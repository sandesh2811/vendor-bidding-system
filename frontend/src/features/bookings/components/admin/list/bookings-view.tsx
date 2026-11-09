"use client";

import { HandCoinsIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/data-table/data-table";
import { ListEmptyState } from "@/components/data-table/list-empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { useBookingList } from "../../../hooks/use-booking-list";
import { bookingColumnClasses, bookingColumns, bookingSkeletons } from "./booking-columns";
import { BookingFilters } from "./booking-filters";

export function BookingsView() {
  const router = useRouter();
  const list = useBookingList();

  return (
    <>
      <PageHeader
        section="Bookings"
        title="Bookings"
        description="Winning bids with what's been paid and what's still pending, newest first."
      />
      <div className="px-4 pb-8 md:px-8">
        <Card className="gap-0 py-0">
          <BookingFilters {...list} />
          <DataTable
            query={list.query}
            columns={bookingColumns}
            pagination={list.pagination}
            onPaginationChange={list.setPagination}
            onRowClick={(booking) => router.push(`/admin/bookings/${booking.id}`)}
            columnClasses={bookingColumnClasses}
            skeletons={bookingSkeletons}
            errorTitle="Couldn't load bookings"
            empty={
              <ListEmptyState
                icon={HandCoinsIcon}
                noun="bookings"
                filtered={list.hasFilters}
                onClearFilters={list.clearFilters}
                title="No bookings yet"
                description="A booking appears here when you select a winning bid on a quotation."
              />
            }
          />
        </Card>
      </div>
    </>
  );
}
