"use client";

import { SendIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/layout/empty-state";
import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS } from "@/features/vendors/constants";
import { VendorIdentity } from "@/features/vendors/components/shared/vendor-identity";
import { formatDate } from "@/lib/format";
import type { QuotationRecipient } from "../../types";
import { SendToVendorsDialog } from "./send-to-vendors-dialog";

const invitationState = ({ viewedAt, declinedAt }: QuotationRecipient) =>
  declinedAt ? `Declined ${formatDate(declinedAt)}` : viewedAt ? `Viewed ${formatDate(viewedAt)}` : "Not opened";

/* who has the quotation, most recent first, and the way to send it to more vendors (only while draft or open) */
export function RecipientsCard({
  quotationId,
  recipients,
  canSend,
}: {
  quotationId: string;
  recipients: QuotationRecipient[];
  canSend: boolean;
}) {
  const [sending, setSending] = useState(false);
  const sentTo = useMemo(() => recipients.map((recipient) => recipient.vendorId), [recipients]);

  const sendButton = (
    <Button size="sm" variant={recipients.length ? "outline" : "default"} onClick={() => setSending(true)}>
      <SendIcon data-icon="inline-start" />
      Send
    </Button>
  );

  return (
    <>
      <SectionCard
        title="Vendors"
        description={recipients.length ? `Sent to ${recipients.length}` : "Draft"}
        action={recipients.length && canSend ? sendButton : undefined}
      >
        {recipients.length ? (
          <ul className="-my-2 divide-y">
            {recipients.map((recipient) => (
              <li key={recipient.id} className="py-3">
                <VendorIdentity name={recipient.vendor.name}>
                  <div className="truncate text-xs text-muted-foreground">
                    {CATEGORY_LABELS[recipient.vendor.category]} · Sent {formatDate(recipient.sentAt)} ·{" "}
                    {invitationState(recipient)}
                  </div>
                  {recipient.declineReason && (
                    <div className="mt-0.5 text-xs whitespace-pre-line text-muted-foreground">
                      &ldquo;{recipient.declineReason}&rdquo;
                    </div>
                  )}
                </VendorIdentity>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={SendIcon}
            title="Not sent yet"
            description={canSend ? "Choose vendors to ask for a price." : "This quotation was never sent."}
            action={canSend ? sendButton : undefined}
            className="py-6"
          />
        )}
      </SectionCard>
      <SendToVendorsDialog quotationId={quotationId} sentTo={sentTo} open={sending} onOpenChange={setSending} />
    </>
  );
}
