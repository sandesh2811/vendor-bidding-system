import { useMutation, useQueryClient } from "@tanstack/react-query";
import { declineReceived, receivedKeys } from "../api/received-quotations.api";

/* vendor: the request page and the requests list both show the decline */
export function useDeclineQuotation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason: string | null) => declineReceived(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: receivedKeys.all }),
  });
}
