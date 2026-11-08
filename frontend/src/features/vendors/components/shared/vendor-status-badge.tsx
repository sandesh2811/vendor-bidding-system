import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function VendorStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <span
        aria-hidden
        className={cn("size-1.5 rounded-full", isActive ? "bg-success" : "bg-muted-foreground/40")}
      />
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}
