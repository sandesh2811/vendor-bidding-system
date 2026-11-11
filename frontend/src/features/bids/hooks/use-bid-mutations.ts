import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { quotationKeys } from "@/features/quotations/api/quotations.api";
import { receivedKeys } from "@/features/quotations/api/received-quotations.api";
import { bidKeys, selectBid, submitBid } from "../api/bids.api";
import type { SubmitBidInput } from "../types";

export function useSubmitBid(quotationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitBidInput) => submitBid(quotationId, input),
    /* the toast lives here, not in mutate(): saving remounts the form (its key is the bid's updatedAt), which drops per-call callbacks */
    onSuccess: (bid) => {
      const updated = queryClient.getQueryData(bidKeys.mine(quotationId)) != null;
      toast.success(updated ? "Bid updated" : "Bid submitted");
      queryClient.setQueryData(bidKeys.mine(quotationId), bid);
      /* bidStatus on the request list and page */
      return queryClient.invalidateQueries({ queryKey: receivedKeys.all });
    },
  });
}

/* every bid's status and the quotation's status change, so both refetch; a 409 also refetches */
export function useSelectBid(quotationId: string) {
  const queryClient = useQueryClient();
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: quotationKeys.all }),
      queryClient.invalidateQueries({ queryKey: bidKeys.forQuotation(quotationId) }),
    ]);
  return useMutation({
    mutationFn: (bidId: string) => selectBid(bidId),
    onSettled: refresh,
  });
}
