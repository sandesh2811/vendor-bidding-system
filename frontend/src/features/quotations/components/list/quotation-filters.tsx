"use client";

import { FilterBar } from "@/components/filters/filter-bar";
import { FilterSelect } from "@/components/filters/filter-select";
import { SearchInput } from "@/components/filters/search-input";
import { ALL } from "@/components/filters/use-list-filters";
import { EVENT_TYPE_LABELS, QUOTATION_STATUS_LABELS } from "../../constants";
import type { useQuotationList } from "../../hooks/use-quotation-list";

const eventTypeItems = { [ALL]: "All event types", ...EVENT_TYPE_LABELS };
const statusItems = { [ALL]: "All statuses", ...QUOTATION_STATUS_LABELS };

type QuotationFilterState = Pick<
  ReturnType<typeof useQuotationList>,
  "filters" | "setFilter" | "clearFilters" | "hasFilters"
>;

export function QuotationFilters({ filters, setFilter, clearFilters, hasFilters }: QuotationFilterState) {
  return (
    <FilterBar hasFilters={hasFilters} onClear={clearFilters}>
      <SearchInput
        value={filters.search}
        onChange={(value) => setFilter("search", value)}
        placeholder="Search by title or location"
        label="Search quotations"
      />
      <FilterSelect
        items={statusItems}
        value={filters.status}
        onChange={(value) => setFilter("status", value)}
        label="Filter by status"
        className="sm:w-40"
      />
      <FilterSelect
        items={eventTypeItems}
        value={filters.eventType}
        onChange={(value) => setFilter("eventType", value)}
        label="Filter by event type"
        className="sm:w-44"
      />
    </FilterBar>
  );
}
