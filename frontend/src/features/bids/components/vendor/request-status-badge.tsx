import { Badge } from "@/components/ui/badge";
import type { ReceivedQuotation } from "@/features/quotations/types";
import { cn } from "@/lib/utils";

/* the vendor's view of a request: its own bid status first, then the request's status */
function requestStatus({ bidStatus, status }: Pick<ReceivedQuotation, "bidStatus" | "status">) {
  if (bidStatus === "selected") return { label: "Selected", dot: "bg-success" };
  if (bidStatus === "rejected") return { label: "Not selected", dot: "bg-muted-foreground/40" };
  if (bidStatus === "submitted") return { label: "Bid submitted", dot: "bg-primary" };
  if (status === "cancelled") return { label: "Cancelled", dot: "bg-destructive" };
  if (status !== "open") return { label: "Closed", dot: "bg-muted-foreground/40" };
  return { label: "Awaiting bid", dot: "bg-amber-500" };
}

export function RequestStatusBadge({ quotation }: { quotation: Pick<ReceivedQuotation, "bidStatus" | "status"> }) {
  const { label, dot } = requestStatus(quotation);
  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <span aria-hidden className={cn("size-1.5 rounded-full", dot)} />
      {label}
    </Badge>
  );
}
