import type { Metadata } from "next";
import { ReceivedQuotationsView } from "@/features/quotations/components/received/received-quotations-view";

export const metadata: Metadata = { title: "Requests" };

export default function VendorHomePage() {
  return <ReceivedQuotationsView />;
}
