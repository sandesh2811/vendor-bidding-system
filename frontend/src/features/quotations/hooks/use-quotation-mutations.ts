import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addRecipients, quotationKeys, removePhoto, updateQuotation, uploadPhotos } from "../api/quotations.api";
import type { QuotationDetail, UpdateQuotationInput } from "../types";

/* writes that return the full quotation put it straight into the detail cache; lists refetch for counts and order */
function useQuotationCache(id: string) {
  const queryClient = useQueryClient();
  return {
    store: (detail: QuotationDetail) => {
      queryClient.setQueryData(quotationKeys.detail(id), detail);
      return queryClient.invalidateQueries({ queryKey: quotationKeys.lists() });
    },
    refresh: () => queryClient.invalidateQueries({ queryKey: quotationKeys.all }),
  };
}

export function useUpdateQuotation(id: string) {
  const cache = useQuotationCache(id);
  return useMutation({
    mutationFn: (input: UpdateQuotationInput) => updateQuotation(id, input),
    onSuccess: cache.store,
  });
}

export function useAddRecipients(id: string) {
  const cache = useQuotationCache(id);
  return useMutation({
    mutationFn: (vendorIds: string[]) => addRecipients(id, vendorIds),
    onSuccess: cache.store,
  });
}

export function useUploadPhotos(id: string) {
  const cache = useQuotationCache(id);
  return useMutation({
    mutationFn: (files: File[]) => uploadPhotos(id, files),
    onSuccess: cache.refresh,
  });
}

export function useRemovePhoto(id: string) {
  const cache = useQuotationCache(id);
  return useMutation({
    mutationFn: (photoId: string) => removePhoto(id, photoId),
    onSuccess: cache.refresh,
  });
}
