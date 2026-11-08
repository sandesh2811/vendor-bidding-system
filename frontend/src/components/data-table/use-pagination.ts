import type { PaginationState } from "@tanstack/react-table";
import { useState } from "react";

/* page state for a server-paginated list, plus the `page`/`limit` params the API expects */
export function usePagination(pageSize = 10) {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize });

  /* any filter change starts again from the first page */
  const resetPage = () => setPagination((current) => (current.pageIndex === 0 ? current : { ...current, pageIndex: 0 }));

  /* call during render once totalPages is known: a write that empties the last page steps back to the new last page */
  const clampTo = (totalPages: number) => {
    if (totalPages > 0 && pagination.pageIndex >= totalPages)
      setPagination({ ...pagination, pageIndex: totalPages - 1 });
  };

  return {
    pagination,
    setPagination,
    resetPage,
    clampTo,
    pageParams: { page: pagination.pageIndex + 1, limit: pagination.pageSize },
  };
}
