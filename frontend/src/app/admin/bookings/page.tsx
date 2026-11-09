import type { Metadata } from "next";
import { BookingsView } from "@/features/bookings/components/admin/list/bookings-view";

export const metadata: Metadata = { title: "Bookings" };

export default function BookingsPage() {
  return <BookingsView />;
}
