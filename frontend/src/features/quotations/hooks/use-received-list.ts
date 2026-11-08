import { useQuery } from "@tanstack/react-query";
import { usePagination } from "@/components/data-table/use-pagination";
import { receivedQuotationsQuery } from "../api/received-quotations.api";

/* the vendor's own requests, most recently received first */
export function useReceivedList() {
  const page = usePagination();
  const query = useQuery(receivedQuotationsQuery(page.pageParams));
  page.clampTo(query.data?.meta.totalPages ?? 0);
  return { query, ...page };
}
