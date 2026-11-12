"use client";

import { useQuery } from "@tanstack/react-query";
import { PencilIcon, PlusIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { PendingButton } from "@/components/form/pending-button";
import { QueryError } from "@/components/layout/query-error";
import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { ownPaymentDetailsQuery, ownQrUrl } from "../../api/payment-details.api";
import { PAYMENT_LIMITS } from "../../constants";
import { useRemovePaymentQr, useUploadPaymentQr } from "../../hooks/use-payment-details-mutations";
import { PaymentDetailsFacts } from "../shared/payment-details-facts";
import { BankAccountSheet } from "./bank-account-sheet";

const QR_MAX_MB = PAYMENT_LIMITS.QR_MAX_BYTES / 1024 / 1024;

/* the vendor's own payout details: a bank account and/or a QR, each managed separately */
export function PaymentDetailsCard() {
  const query = useQuery(ownPaymentDetailsQuery);
  const upload = useUploadPaymentQr();
  const remove = useRemovePaymentQr();
  const [editingBank, setEditingBank] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  function onPick(file: File | undefined) {
    /* clear so picking the same file again still fires change */
    if (input.current) input.current.value = "";
    if (!file) return;
    if (!(PAYMENT_LIMITS.QR_TYPES as readonly string[]).includes(file.type))
      return toast.warning(`${file.name} isn't a JPEG, PNG or WebP image`);
    if (file.size > PAYMENT_LIMITS.QR_MAX_BYTES) return toast.warning(`${file.name} is larger than ${QR_MAX_MB} MB`);
    upload.mutate(file);
  }

  const details = query.data;

  return (
    <SectionCard
      title="Payment details"
      description={
        details?.updatedAt
          ? `Where Mero Event sends your booking payments. Last changed ${formatDate(details.updatedAt)}.`
          : "Where Mero Event sends your booking payments. Add a bank account, a payment QR, or both."
      }
    >
      {query.isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : query.isError ? (
        <QueryError
          title="Couldn't load your payment details"
          error={query.error}
          onRetry={() => query.refetch()}
          isRetrying={query.isFetching}
        />
      ) : (
        <>
          <PaymentDetailsFacts
            details={query.data}
            qrSrc={ownQrUrl(query.data)}
            bankAction={
              <Button variant="outline" size="sm" onClick={() => setEditingBank(true)}>
                {query.data.accountNumber ? <PencilIcon data-icon="inline-start" /> : <PlusIcon data-icon="inline-start" />}
                {query.data.accountNumber ? "Edit" : "Add"}
              </Button>
            }
            qrAction={
              <div className="flex gap-1">
                <PendingButton
                  type="button"
                  variant="outline"
                  size="sm"
                  pending={upload.isPending}
                  onClick={() => input.current?.click()}
                >
                  {!upload.isPending && <UploadIcon data-icon="inline-start" />}
                  {query.data.hasQr ? "Replace" : "Upload"}
                </PendingButton>
                {query.data.hasQr && (
                  <PendingButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Remove payment QR"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    pending={remove.isPending}
                    onClick={() => remove.mutate()}
                  >
                    {!remove.isPending && <Trash2Icon />}
                  </PendingButton>
                )}
              </div>
            }
          />
          <input
            ref={input}
            type="file"
            accept={PAYMENT_LIMITS.QR_TYPES.join(",")}
            hidden
            onChange={(e) => onPick(e.target.files?.[0])}
          />
          <BankAccountSheet details={query.data} open={editingBank} onOpenChange={setEditingBank} />
        </>
      )}
    </SectionCard>
  );
}
