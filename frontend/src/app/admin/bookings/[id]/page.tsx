import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminTopBar } from "@/components/layout/page-header";
import { BookingDetailView } from "@/features/bookings/components/admin/detail/booking-detail-view";
import { BookingSkeleton } from "@/features/bookings/components/shared/booking-skeleton";

export const metadata: Metadata = { title: "Booking" };

/* the id is only known per request, so it's read inside Suspense (cacheComponents) */
export default function BookingPage({ params }: PageProps<"/admin/bookings/[id]">) {
  return (
    <Suspense
      fallback={
        <>
          <AdminTopBar section="Bookings" />
          <BookingSkeleton />
        </>
      }
    >
      {params.then(({ id }) => (
        <BookingDetailView id={id} />
      ))}
    </Suspense>
  );
}
