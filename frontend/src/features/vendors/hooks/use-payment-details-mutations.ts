import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  clearBankAccount,
  paymentDetailsKeys,
  removePaymentQr,
  updateBankAccount,
  uploadPaymentQr,
} from "../api/payment-details.api";
import type { PaymentDetails } from "../types";

/* every payment-details write returns the full details, which replace the cached copy */
function usePaymentDetailsMutation<TInput>(mutationFn: (input: TInput) => Promise<PaymentDetails>, success: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (details) => {
      queryClient.setQueryData(paymentDetailsKeys.own, details);
      toast.success(success);
    },
  });
}

export const useUpdateBankAccount = () => usePaymentDetailsMutation(updateBankAccount, "Bank account saved");

export const useClearBankAccount = () => usePaymentDetailsMutation<void>(clearBankAccount, "Bank account removed");

export const useUploadPaymentQr = () => usePaymentDetailsMutation(uploadPaymentQr, "Payment QR saved");

export const useRemovePaymentQr = () => usePaymentDetailsMutation<void>(removePaymentQr, "Payment QR removed");
