import type { ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

/* avatar initials + name, with an optional secondary line; used in tables and recipient lists */
export function VendorIdentity({
  name,
  children,
  className,
}: {
  name: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <Avatar>
        <AvatarFallback className="bg-primary/5 text-xs font-medium text-primary">{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="truncate font-medium text-foreground">{name}</div>
        {children}
      </div>
    </div>
  );
}
