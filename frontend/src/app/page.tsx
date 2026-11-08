"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { QueryError } from "@/components/layout/query-error";
import { Spinner } from "@/components/ui/spinner";
import { homeFor } from "@/features/auth/require-role";
import { meQuery } from "@/lib/api";

/* entry point: send each user to their portal, or to login */
export default function HomePage() {
  const router = useRouter();
  const { data: user, isPending, isError, error, refetch, isFetching } = useQuery(meQuery);

  useEffect(() => {
    if (!isPending && !isError) router.replace(user ? homeFor(user) : "/login");
  }, [isPending, isError, user, router]);

  if (isError) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <QueryError
          title="Couldn't reach Mero Event"
          error={error}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center">
      <Spinner className="size-5 text-muted-foreground" />
    </div>
  );
}
