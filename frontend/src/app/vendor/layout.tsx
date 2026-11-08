import { VendorShell } from "@/components/layout/vendor-shell";
import { RequireRole } from "@/features/auth/require-role";

export default function VendorLayout({ children }: LayoutProps<"/vendor">) {
  return (
    <RequireRole role="vendor">
      <VendorShell>{children}</VendorShell>
    </RequireRole>
  );
}
