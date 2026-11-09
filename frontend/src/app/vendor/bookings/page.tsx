import type { Metadata } from "next";
import { VendorBookingsView } from "@/features/bookings/components/vendor/vendor-bookings-view";

export const metadata: Metadata = { title: "Bookings" };

export default function VendorBookingsPage() {
  return <VendorBookingsView />;
}
