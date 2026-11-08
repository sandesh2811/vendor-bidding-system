"use client";

import { FilterBar } from "@/components/filters/filter-bar";
import { FilterSelect } from "@/components/filters/filter-select";
import { SearchInput } from "@/components/filters/search-input";
import { ALL } from "@/components/filters/use-list-filters";
import { CATEGORY_LABELS } from "../../constants";
import type { useVendorList } from "../../hooks/use-vendor-list";

const categoryItems = { [ALL]: "All categories", ...CATEGORY_LABELS };
const statusItems = { [ALL]: "Any status", active: "Active", inactive: "Inactive" };

type VendorFilterState = Pick<ReturnType<typeof useVendorList>, "filters" | "setFilter" | "clearFilters" | "hasFilters">;

export function VendorFilters({ filters, setFilter, clearFilters, hasFilters }: VendorFilterState) {
  return (
    <FilterBar hasFilters={hasFilters} onClear={clearFilters}>
      <SearchInput
        value={filters.search}
        onChange={(value) => setFilter("search", value)}
        placeholder="Search by vendor or contact"
        label="Search vendors"
      />
      <div className="flex min-w-0 gap-2">
        <FilterSelect
          items={categoryItems}
          value={filters.category}
          onChange={(value) => setFilter("category", value)}
          label="Filter by category"
          className="sm:w-44"
        />
        <FilterSelect
          items={statusItems}
          value={filters.status}
          onChange={(value) => setFilter("status", value)}
          label="Filter by status"
          className="sm:w-36"
        />
      </div>
    </FilterBar>
  );
}
