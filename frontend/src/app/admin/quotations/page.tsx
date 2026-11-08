import type { Metadata } from "next";
import { QuotationsView } from "@/features/quotations/components/list/quotations-view";

export const metadata: Metadata = { title: "Quotations" };

export default function QuotationsPage() {
  return <QuotationsView />;
}
