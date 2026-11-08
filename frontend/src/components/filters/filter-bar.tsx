import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

/* toolbar above a list: search and filters, with "Clear filters" once any is set */
export function FilterBar({
  children,
  hasFilters,
  onClear,
}: {
  children: ReactNode;
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center">
      {children}
      {hasFilters && (
        <Button variant="ghost" onClick={onClear} className="text-muted-foreground sm:ml-auto">
          Clear filters
        </Button>
      )}
    </div>
  );
}
