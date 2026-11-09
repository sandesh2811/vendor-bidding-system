import type { ComponentType, ReactNode } from "react";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

/* "nothing here yet" placeholder: icon, title, one line of guidance and an optional action */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: ComponentType;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Empty className={cn("py-16", className)}>
      <EmptyHeader>
        <EmptyMedia className="text-muted-foreground/70 [&_svg]:size-6">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}
