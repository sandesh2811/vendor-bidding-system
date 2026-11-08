import type { ComponentType, ReactNode } from "react";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";

/* an empty list: "no matches" with a way out when filtered, otherwise the first-use prompt */
export function ListEmptyState({
  icon,
  noun,
  filtered,
  onClearFilters,
  title,
  description,
  action,
}: {
  icon: ComponentType;
  /* plural, e.g. "vendors" */
  noun: string;
  filtered: boolean;
  onClearFilters: () => void;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  if (filtered)
    return (
      <EmptyState
        icon={icon}
        title={`No matching ${noun}`}
        description="Try a different search or clear the filters."
        action={
          <Button variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
        }
      />
    );

  return <EmptyState icon={icon} title={title} description={description} action={action} />;
}
