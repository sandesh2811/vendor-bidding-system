import type { Metadata } from "next";
import { VendorProfileView } from "@/features/vendors/components/portal/vendor-profile-view";

export const metadata: Metadata = { title: "Profile" };

export default function VendorProfilePage() {
  return <VendorProfileView />;
}
