import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { errorMessage } from "@/lib/api";
import { addRecipients, createQuotation, quotationKeys, uploadPhotos } from "../api/quotations.api";
import type { CreateQuotationInput, QuotationDetail } from "../types";

export interface CreateQuotationRequest {
  input: CreateQuotationInput;
  photos: File[];
  vendorIds: string[];
}

/* the quotation is saved even if a later step fails; the caller sends the admin to it to finish there */
export interface CreateQuotationResult {
  quotation: QuotationDetail;
  failed?: { step: "photos" | "vendors"; error: unknown };
}

/**
 * Create → upload photos → send to vendors. Vendors are added last, so they never see a request
 * before its photos. Every step is idempotent on the API, so resubmitting after a failure is safe.
 */
async function runCreate({ input, photos, vendorIds }: CreateQuotationRequest): Promise<CreateQuotationResult> {
  /* without photos there is nothing to wait for: send in the same request */
  const quotation = await createQuotation(photos.length ? input : { ...input, vendorIds });
  if (!photos.length) return { quotation };

  try {
    await uploadPhotos(quotation.id, photos);
  } catch (error) {
    return { quotation, failed: { step: "photos", error } };
  }

  if (!vendorIds.length) return { quotation };

  try {
    return { quotation: await addRecipients(quotation.id, vendorIds) };
  } catch (error) {
    return { quotation, failed: { step: "vendors", error } };
  }
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: runCreate,
    onSuccess: (result) => {
      notify(result);
      return queryClient.invalidateQueries({ queryKey: quotationKeys.all });
    },
  });
}

function notify({ quotation, failed }: CreateQuotationResult) {
  if (failed) {
    const what = failed.step === "photos" ? "uploading the photos" : "sending it to vendors";
    toast.error(`Quotation saved, but ${what} failed`, {
      description: `${errorMessage(failed.error)} You can finish from the quotation page.`,
    });
    return;
  }

  const sent = quotation.recipients.length;
  toast.success(`${quotation.title} created`, {
    description: sent ? `Sent to ${sent} vendor${sent === 1 ? "" : "s"}.` : "Saved as a draft.",
  });
}
