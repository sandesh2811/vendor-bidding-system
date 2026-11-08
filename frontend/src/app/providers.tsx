"use client";

import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { errorMessage } from "@/lib/api";

/* failed writes surface as a toast; failed reads render an inline fallback (QueryError) where the data would be */
const notify = (error: unknown) => toast.error(errorMessage(error));

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({ onError: notify }),
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster theme="light" position="bottom-right" richColors />
    </QueryClientProvider>
  );
}
