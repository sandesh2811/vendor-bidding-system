import type { Metadata } from "next";
import { CreateQuotationView } from "@/features/quotations/components/create/create-quotation-view";

export const metadata: Metadata = { title: "New quotation" };

export default function NewQuotationPage() {
  return <CreateQuotationView />;
}
