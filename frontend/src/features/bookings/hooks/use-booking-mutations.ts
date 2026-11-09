import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addPayment, bookingKeys, deletePayment, updateBooking } from "../api/bookings.api";
import type { CreatePaymentInput, UpdateBookingInput } from "../types";

/* every write changes the detail's amounts and the list's columns, so the whole bookings key refetches */
function useBookingMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: bookingKeys.all }),
  });
}

export const useUpdateBooking = (id: string) =>
  useBookingMutation((input: UpdateBookingInput) => updateBooking(id, input));

export const useAddPayment = (id: string) => useBookingMutation((input: CreatePaymentInput) => addPayment(id, input));

export const useDeletePayment = (id: string) => useBookingMutation((paymentId: string) => deletePayment(id, paymentId));
