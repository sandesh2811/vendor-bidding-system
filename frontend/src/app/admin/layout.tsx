import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { RequireRole } from "@/features/auth/require-role";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <RequireRole role="admin">
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset className="min-w-0 bg-muted/40">{children}</SidebarInset>
      </SidebarProvider>
    </RequireRole>
  );
}
