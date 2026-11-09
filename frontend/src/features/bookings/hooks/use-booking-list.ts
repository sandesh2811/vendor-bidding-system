import { useQuery } from "@tanstack/react-query";
import { usePagination } from "@/components/data-table/use-pagination";
import { ALL, type All, unlessAll, useListFilters } from "@/components/filters/use-list-filters";
import { bookingsQuery, vendorBookingsQuery } from "../api/bookings.api";
import type { BookingStatus, PaymentStatus } from "../constants";

const INITIAL_FILTERS = {
  status: ALL as BookingStatus | All,
  paymentStatus: ALL as PaymentStatus | All,
};

/* the admin booking list, newest first: booking and payment status filters, server pagination */
export function useBookingList() {
  const page = usePagination();
  const filterState = useListFilters(INITIAL_FILTERS, page.resetPage);
  const { status, paymentStatus } = filterState.filters;

  const query = useQuery(
    bookingsQuery({
      ...page.pageParams,
      status: unlessAll(status),
      paymentStatus: unlessAll(paymentStatus),
    }),
  );
  page.clampTo(query.data?.meta.totalPages ?? 0);

  return { query, ...page, ...filterState };
}

/* the vendor's own bookings, newest first */
export function useVendorBookingList() {
  const page = usePagination();
  const query = useQuery(vendorBookingsQuery(page.pageParams));
  page.clampTo(query.data?.meta.totalPages ?? 0);
  return { query, ...page };
}
