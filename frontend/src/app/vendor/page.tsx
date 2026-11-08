"use client";

import { useQuery } from "@tanstack/react-query";
import { InboxIcon, LogOutIcon } from "lucide-react";
import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { RequireRole } from "@/features/auth/require-role";
import { useLogout } from "@/features/auth/use-logout";
import { meQuery } from "@/lib/api";

/* vendor portal landing; requests and bids arrive with the request module */
export default function VendorHomePage() {
  return (
    <RequireRole role="vendor">
      <VendorHome />
    </RequireRole>
  );
}

function VendorHome() {
  const { data: user } = useQuery(meQuery);
  const logoutMutation = useLogout();

  return (
    <div className="min-h-svh bg-muted/40">
      <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:px-8">
        <div className="flex items-center gap-2.5">
          <BrandMark className="size-7 text-sm" />
          <span className="font-semibold">Mero Event</span>
          <span className="hidden text-sm text-muted-foreground sm:inline">Vendor portal</span>
        </div>
        <Button variant="ghost" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
          <LogOutIcon data-icon="inline-start" />
          Log out
        </Button>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{user ? `Welcome, ${user.name}` : "Welcome"}</h1>
          <p className="text-sm text-muted-foreground">Work requests from Mero Event will appear here.</p>
        </div>
        <Empty className="border bg-background py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <InboxIcon />
            </EmptyMedia>
            <EmptyTitle>No requests yet</EmptyTitle>
            <EmptyDescription>When Mero Event sends you a request to quote, you&apos;ll see it here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </main>
    </div>
  );
}
