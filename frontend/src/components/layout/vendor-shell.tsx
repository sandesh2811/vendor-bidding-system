"use client";

import { useQuery } from "@tanstack/react-query";
import { LogOutIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/features/auth/use-logout";
import { meQuery } from "@/lib/api";
import { cn } from "@/lib/utils";
import { BrandMark } from "./brand-mark";

const VENDOR_NAV = [
  { title: "Requests", href: "/vendor", matches: (path: string) => path === "/vendor" || path.startsWith("/vendor/quotations") },
  { title: "Bookings", href: "/vendor/bookings", matches: (path: string) => path.startsWith("/vendor/bookings") },
] as const;

/* vendor portal frame: brand, nav, signed-in vendor and log out, above a centered content column */
export function VendorShell({ children }: { children: ReactNode }) {
  const { data: user } = useQuery(meQuery);
  const pathname = usePathname();
  const logoutMutation = useLogout();

  return (
    <div className="min-h-svh bg-muted/40">
      <header className="flex h-14 items-center justify-between gap-4 border-b bg-background px-4 md:px-8">
        <Link href="/vendor" className="flex min-w-0 items-center gap-2.5">
          <BrandMark className="size-7 text-sm" />
          <span className="font-semibold">Mero Event</span>
          <span className="hidden text-sm text-muted-foreground lg:inline">Vendor portal</span>
        </Link>
        <nav aria-label="Vendor portal" className="mr-auto flex items-center gap-1">
          {VENDOR_NAV.map((item) => {
            const active = item.matches(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                  active && "bg-muted font-medium text-foreground",
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>
        <div className="flex min-w-0 items-center gap-2">
          {user && <span className="hidden truncate text-sm text-muted-foreground md:inline">{user.name}</span>}
          <Button variant="ghost" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
            <LogOutIcon data-icon="inline-start" />
            Log out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
