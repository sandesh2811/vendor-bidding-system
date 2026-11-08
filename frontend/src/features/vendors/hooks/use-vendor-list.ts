import { useQuery } from "@tanstack/react-query";
import { usePagination } from "@/components/data-table/use-pagination";
import { ALL, type All, unlessAll, useListFilters } from "@/components/filters/use-list-filters";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { vendorsQuery } from "../api/vendors.api";
import type { VendorCategory } from "../constants";

export type VendorStatusFilter = "active" | "inactive" | All;

const INITIAL_FILTERS = {
  search: "",
  category: ALL as VendorCategory | All,
  status: ALL as VendorStatusFilter,
};

/* the admin vendor list: filters, debounced search and server pagination, as one query */
export function useVendorList() {
  const page = usePagination();
  const filterState = useListFilters(INITIAL_FILTERS, page.resetPage);
  const { search, category, status } = filterState.filters;
  const debouncedSearch = useDebouncedValue(search.trim());

  const query = useQuery(
    vendorsQuery({
      ...page.pageParams,
      search: debouncedSearch || undefined,
      category: unlessAll(category),
      isActive: status === ALL ? undefined : status === "active",
    }),
  );

  /* a deactivation under the "Active" filter can empty the last page */
  page.clampTo(query.data?.meta.totalPages ?? 0);

  return { query, ...page, ...filterState };
}
