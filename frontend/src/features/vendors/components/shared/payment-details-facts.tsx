"use client";

import { CopyIcon, QrCodeIcon } from "lucide-react";
import Image from "next/image";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PhotoLightbox } from "@/features/quotations/components/shared/photo-lightbox";
import type { PaymentDetails } from "../../types";

/* a vendor's bank account and payment QR side by side; each half takes optional actions (vendor portal) */
export function PaymentDetailsFacts({
  details,
  qrSrc,
  bankAction,
  qrAction,
}: {
  details: PaymentDetails;
  qrSrc: string;
  bankAction?: ReactNode;
  qrAction?: ReactNode;
}) {
  const [viewing, setViewing] = useState(false);

  const facts = [
    ["Bank", details.bankName],
    ["Account name", details.accountName],
    ["Branch", details.branch],
  ] as const;

  function copyAccountNumber() {
    if (!details.accountNumber) return;
    navigator.clipboard
      .writeText(details.accountNumber)
      .then(() => toast.success("Account number copied"))
      .catch(() => toast.error("Couldn't copy. Select the number instead."));
  }

  return (
    <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">Bank account</h3>
          {bankAction}
        </div>
        {details.accountNumber ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Account number</dt>
              <dd className="flex items-center gap-1">
                <span className="font-mono text-sm font-medium break-all">{details.accountNumber}</span>
                <Button variant="ghost" size="icon-xs" aria-label="Copy account number" onClick={copyAccountNumber}>
                  <CopyIcon />
                </Button>
              </dd>
            </div>
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-sm font-medium break-words">
                  {value || <span className="font-normal text-muted-foreground">Not added</span>}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">No bank account added.</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">Payment QR</h3>
          {qrAction}
        </div>
        {details.hasQr ? (
          <button
            type="button"
            onClick={() => setViewing(true)}
            aria-label="View payment QR"
            className="relative size-40 overflow-hidden rounded-lg border bg-white focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {/* unoptimized: the browser fetches it directly, with the session cookie the API requires */}
            <Image src={qrSrc} alt="Payment QR" fill unoptimized className="object-contain" />
          </button>
        ) : (
          <div className="flex size-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground">
            <QrCodeIcon className="size-5" />
            No QR added
          </div>
        )}
      </div>

      <PhotoLightbox
        photo={viewing ? { id: "payment-qr", src: qrSrc, name: "Payment QR" } : null}
        onClose={() => setViewing(false)}
      />
    </div>
  );
}
