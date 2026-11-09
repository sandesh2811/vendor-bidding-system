import type { Metadata } from "next";
import { Suspense } from "react";
import { VendorBookingDetailView } from "@/features/bookings/components/vendor/vendor-booking-detail-view";
import { BookingSkeleton } from "@/features/bookings/components/shared/booking-skeleton";

export const metadata: Metadata = { title: "Booking" };

/* the id is only known per request, so it's read inside Suspense (cacheComponents) */
export default function VendorBookingPage({ params }: PageProps<"/vendor/bookings/[id]">) {
  return (
    <Suspense fallback={<BookingSkeleton className="" />}>
      {params.then(({ id }) => (
        <VendorBookingDetailView id={id} />
      ))}
    </Suspense>
  );
}
