"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { vendorSummaryQuery } from "../../api/vendor-portal.api";

const CARDS = [
  { key: "newRequests", label: "New requests", hint: "Open, waiting for your bid", href: "/vendor" },
  { key: "bidsInProgress", label: "Bids in progress", hint: "Waiting for Mero Event's decision", href: "/vendor" },
  { key: "upcomingBookings", label: "Upcoming bookings", hint: "Confirmed work", href: "/vendor/bookings" },
] as const;

/* what needs the vendor's attention; hidden on error, since the list below still works */
export function VendorSummaryCards() {
  const { data, isPending, isError } = useQuery(vendorSummaryQuery);
  if (isError) return null;

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      {CARDS.map((card) => (
        <Link
          key={card.key}
          href={card.href}
          className="rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Card className="gap-1 py-4 transition-colors hover:bg-muted/40">
            <CardHeader className="px-5">
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {isPending ? <Skeleton className="h-8 w-10" /> : data[card.key]}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{card.hint}</p>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
