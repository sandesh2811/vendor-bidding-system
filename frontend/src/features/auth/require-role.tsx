"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { QueryError } from "@/components/layout/query-error";
import { Spinner } from "@/components/ui/spinner";
import { meQuery, type User } from "@/lib/api";

export const homeFor = (user: User) => (user.role === "admin" ? "/admin/vendors" : "/vendor");

/* client-side gate: the API enforces roles, this only keeps users out of screens they can't use */
export function RequireRole({ role, children }: { role: User["role"]; children: ReactNode }) {
  const router = useRouter();
  const { data: user, isPending, isError, error, refetch, isFetching } = useQuery(meQuery);

  useEffect(() => {
    if (isPending || isError) return;
    if (!user) router.replace("/login");
    else if (user.role !== role) router.replace(homeFor(user));
  }, [isPending, isError, user, role, router]);

  /* a failed session check (API down, 5xx) is not "logged out": offer a retry instead of bouncing to login */
  if (isError) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <QueryError
          title="Couldn't verify your session"
          error={error}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      </div>
    );
  }

  if (user?.role !== role) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-5 text-muted-foreground" />
      </div>
    );
  }

  return children;
}
