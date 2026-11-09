"use client";

import { FilterBar } from "@/components/filters/filter-bar";
import { FilterSelect } from "@/components/filters/filter-select";
import { ALL } from "@/components/filters/use-list-filters";
import { BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "../../../constants";
import type { useBookingList } from "../../../hooks/use-booking-list";

const statusItems = { [ALL]: "All statuses", ...BOOKING_STATUS_LABELS };
const paymentItems = { [ALL]: "All payments", ...PAYMENT_STATUS_LABELS };

type BookingFilterState = Pick<
  ReturnType<typeof useBookingList>,
  "filters" | "setFilter" | "clearFilters" | "hasFilters"
>;

export function BookingFilters({ filters, setFilter, clearFilters, hasFilters }: BookingFilterState) {
  return (
    <FilterBar hasFilters={hasFilters} onClear={clearFilters}>
      <FilterSelect
        items={paymentItems}
        value={filters.paymentStatus}
        onChange={(value) => setFilter("paymentStatus", value)}
        label="Filter by payment status"
        className="sm:w-44"
      />
      <FilterSelect
        items={statusItems}
        value={filters.status}
        onChange={(value) => setFilter("status", value)}
        label="Filter by booking status"
        className="sm:w-44"
      />
    </FilterBar>
  );
}
