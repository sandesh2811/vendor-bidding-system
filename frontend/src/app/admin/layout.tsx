import { ADMIN_NAV, PortalSidebar } from "@/components/layout/portal-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { RequireRole } from "@/features/auth/require-role";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <RequireRole role="admin">
      <SidebarProvider>
        <PortalSidebar nav={ADMIN_NAV} homeHref="/admin/vendors" subtitle="Vendor management" roleLabel="Administrator" />
        <SidebarInset className="min-w-0 md:peer-data-[variant=inset]:shadow-none md:peer-data-[variant=inset]:ring-1 md:peer-data-[variant=inset]:ring-border">{children}</SidebarInset>
      </SidebarProvider>
    </RequireRole>
  );
}
