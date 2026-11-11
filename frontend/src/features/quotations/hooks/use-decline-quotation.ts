import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { declineReceived, receivedKeys } from "../api/received-quotations.api";

/* vendor: the request page and the requests list both show the decline */
export function useDeclineQuotation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason: string | null) => declineReceived(id, reason),
    /* toast here, not in mutate(): the refetch hides the Decline dialog, which drops per-call callbacks */
    onSuccess: () => {
      toast.success("Request declined");
      return queryClient.invalidateQueries({ queryKey: receivedKeys.all });
    },
  });
}
