"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminTopBar } from "./page-header";
import { isNavActive, PortalSidebar, VENDOR_NAV } from "./portal-sidebar";

/* vendor portal frame: the same sidebar layout as the admin portal, with one top bar for every vendor page */
export function VendorShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const section = VENDOR_NAV.find((item) => isNavActive(item, pathname))?.title ?? "Vendor portal";

  return (
    <SidebarProvider>
      <PortalSidebar nav={VENDOR_NAV} homeHref="/vendor" subtitle="Vendor portal" roleLabel="Vendor" />
      <SidebarInset className="min-w-0 md:peer-data-[variant=inset]:shadow-none md:peer-data-[variant=inset]:ring-1 md:peer-data-[variant=inset]:ring-border">
        <AdminTopBar section={section} />
        <main className="px-4 pt-8 pb-10 md:px-10">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
