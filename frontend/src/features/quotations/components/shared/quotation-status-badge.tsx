import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { QUOTATION_STATUS_LABELS, type QuotationStatus } from "../../constants";

const DOT: Record<QuotationStatus, string> = {
  draft: "bg-muted-foreground/40",
  open: "bg-primary",
  closed: "bg-warning",
  awarded: "bg-success",
  cancelled: "bg-destructive",
};

export function QuotationStatusBadge({ status }: { status: QuotationStatus }) {
  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <span aria-hidden className={cn("size-1.5 rounded-full", DOT[status])} />
      {QUOTATION_STATUS_LABELS[status]}
    </Badge>
  );
}
