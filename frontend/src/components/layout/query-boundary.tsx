"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { QueryError } from "./query-error";

/* a single-resource fetch: `fallback` while loading, an inline error with retry on failure, else the content */
export function QueryBoundary<TData>({
  query,
  errorTitle,
  fallback,
  children,
}: {
  query: UseQueryResult<TData>;
  errorTitle: string;
  fallback: ReactNode;
  children: (data: TData) => ReactNode;
}) {
  if (query.isPending) return fallback;
  if (query.isError)
    return (
      <QueryError
        title={errorTitle}
        error={query.error}
        onRetry={() => query.refetch()}
        isRetrying={query.isFetching}
        className="m-4 rounded-xl border bg-background md:m-8"
      />
    );
  return children(query.data);
}
