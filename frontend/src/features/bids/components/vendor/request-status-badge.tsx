import { Badge } from "@/components/ui/badge";
import type { ReceivedQuotation } from "@/features/quotations/types";
import { cn } from "@/lib/utils";

type RequestState = Pick<ReceivedQuotation, "bidStatus" | "status" | "viewedAt" | "declinedAt">;

/* the vendor's view of a request: its own bid first, then cancelled, its decline, closed, and whether it has opened it */
function requestStatus({ bidStatus, status, viewedAt, declinedAt }: RequestState) {
  if (bidStatus === "selected") return { label: "Selected", dot: "bg-success" };
  if (bidStatus === "rejected") return { label: "Not selected", dot: "bg-muted-foreground/40" };
  if (bidStatus === "submitted") return { label: "Bid submitted", dot: "bg-primary" };
  if (status === "cancelled") return { label: "Cancelled", dot: "bg-destructive" };
  if (declinedAt) return { label: "Declined", dot: "bg-muted-foreground/40" };
  if (status !== "open") return { label: "Closed", dot: "bg-muted-foreground/40" };
  if (viewedAt) return { label: "Viewed", dot: "bg-warning" };
  return { label: "New", dot: "bg-primary" };
}

export function RequestStatusBadge({ quotation }: { quotation: RequestState }) {
  const { label, dot } = requestStatus(quotation);
  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <span aria-hidden className={cn("size-1.5 rounded-full", dot)} />
      {label}
    </Badge>
  );
}
