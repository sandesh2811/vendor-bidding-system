import { useQuery } from "@tanstack/react-query";
import { usePagination } from "@/components/data-table/use-pagination";
import { ALL, type All, unlessAll, useListFilters } from "@/components/filters/use-list-filters";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { quotationsQuery } from "../api/quotations.api";
import type { EventType } from "../constants";

const INITIAL_FILTERS = { search: "", eventType: ALL as EventType | All };

/* the admin quotation list, newest first: search (title or location), event type and server pagination */
export function useQuotationList() {
  const page = usePagination();
  const filterState = useListFilters(INITIAL_FILTERS, page.resetPage);
  const { search, eventType } = filterState.filters;
  const debouncedSearch = useDebouncedValue(search.trim());

  const query = useQuery(
    quotationsQuery({ ...page.pageParams, search: debouncedSearch || undefined, eventType: unlessAll(eventType) }),
  );
  page.clampTo(query.data?.meta.totalPages ?? 0);

  return { query, ...page, ...filterState };
}
