import type { Metadata } from "next";
import { VendorsView } from "@/features/vendors/components/list/vendors-view";

export const metadata: Metadata = { title: "Vendors" };

export default function VendorsPage() {
  return <VendorsView />;
}
