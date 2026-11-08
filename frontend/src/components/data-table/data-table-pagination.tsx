"use client";

import type { PaginationState } from "@tanstack/react-table";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DataTablePagination({
  pagination,
  total,
  pageCount,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
}: {
  pagination: PaginationState;
  total: number;
  pageCount: number;
  onPrevious: () => void;
  onNext: () => void;
  canPrevious: boolean;
  canNext: boolean;
}) {
  const { pageIndex, pageSize } = pagination;
  const firstShown = total === 0 ? 0 : pageIndex * pageSize + 1;
  const lastShown = Math.min(total, (pageIndex + 1) * pageSize);

  return (
    <div className="flex items-center justify-between gap-4 border-t px-4 py-3 text-sm text-muted-foreground">
      <span className="tabular-nums">
        {firstShown} to {lastShown} of {total}
      </span>
      <div className="flex items-center gap-2">
        <span className="hidden tabular-nums sm:inline">
          Page {pageIndex + 1} of {Math.max(pageCount, 1)}
        </span>
        <Button variant="outline" size="icon-sm" aria-label="Previous page" onClick={onPrevious} disabled={!canPrevious}>
          <ChevronLeftIcon />
        </Button>
        <Button variant="outline" size="icon-sm" aria-label="Next page" onClick={onNext} disabled={!canNext}>
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}
