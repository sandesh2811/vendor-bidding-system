"use client";

import { CloudAlertIcon, RotateCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

/* inline fallback for a failed fetch: what went wrong plus a retry, in place of the content */
export function QueryError({
  title,
  error,
  onRetry,
  isRetrying = false,
  className,
}: {
  title: string;
  error: unknown;
  onRetry: () => void;
  isRetrying?: boolean;
  className?: string;
}) {
  return (
    <Empty className={cn("py-16", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
          <CloudAlertIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{errorMessage(error)}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={onRetry} disabled={isRetrying}>
          {isRetrying ? <Spinner data-icon="inline-start" /> : <RotateCwIcon data-icon="inline-start" />}
          Try again
        </Button>
      </EmptyContent>
    </Empty>
  );
}
