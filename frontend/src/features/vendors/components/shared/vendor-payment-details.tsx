"use client";

import { useQuery } from "@tanstack/react-query";
import { TriangleAlertIcon } from "lucide-react";
import { useState } from "react";
import { QueryError } from "@/components/layout/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { vendorPaymentDetailsQuery, vendorQrUrl } from "../../api/payment-details.api";
import type { PaymentDetails } from "../../types";
import { PaymentDetailsFacts } from "./payment-details-facts";

/* changes this recent get a warning: redirecting payouts is what a takeover of the vendor's login would do */
const RECENT_CHANGE_MS = 7 * 24 * 60 * 60 * 1000;

const changedRecently = (details: PaymentDetails, now: number) =>
  details.updatedAt !== null && now - new Date(details.updatedAt).getTime() < RECENT_CHANGE_MS;

/* admin view of where to pay a vendor, read only: the vendor maintains it in its portal */
export function VendorPaymentDetails({ vendorId }: { vendorId: string }) {
  const query = useQuery(vendorPaymentDetailsQuery(vendorId));
  /* read once per mount: render must stay pure */
  const [now] = useState(() => Date.now());

  if (query.isPending) return <Skeleton className="h-40 w-full" />;
  if (query.isError)
    return (
      <QueryError
        title="Couldn't load payment details"
        error={query.error}
        onRetry={() => query.refetch()}
        isRetrying={query.isFetching}
        className="py-8"
      />
    );

  const details = query.data;

  if (!details.accountNumber && !details.hasQr)
    return (
      <p className="text-sm text-muted-foreground">
        The vendor hasn&apos;t added payment details yet. They can add a bank account or QR from their portal profile.
      </p>
    );

  return (
    <div className="flex flex-col gap-4">
      {details.updatedAt &&
        (changedRecently(details, now) ? (
          <p className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
            Changed on {formatDate(details.updatedAt)}. Confirm with the vendor by phone before paying.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Last changed {formatDate(details.updatedAt)}</p>
        ))}
      <PaymentDetailsFacts details={details} qrSrc={vendorQrUrl(details)} />
    </div>
  );
}
