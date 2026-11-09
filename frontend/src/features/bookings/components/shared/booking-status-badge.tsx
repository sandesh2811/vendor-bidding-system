import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BOOKING_STATUS_LABELS, type BookingStatus, PAYMENT_STATUS_LABELS, type PaymentStatus } from "../../constants";

const STATUS_DOT: Record<BookingStatus, string> = {
  confirmed: "bg-primary",
  completed: "bg-success",
  cancelled: "bg-destructive",
};

const PAYMENT_DOT: Record<PaymentStatus, string> = {
  unpaid: "bg-muted-foreground/40",
  partial: "bg-amber-500",
  paid: "bg-success",
};

function DotBadge({ dot, label }: { dot: string; label: string }) {
  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <span aria-hidden className={cn("size-1.5 rounded-full", dot)} />
      {label}
    </Badge>
  );
}

export const BookingStatusBadge = ({ status }: { status: BookingStatus }) => (
  <DotBadge dot={STATUS_DOT[status]} label={BOOKING_STATUS_LABELS[status]} />
);

export const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => (
  <DotBadge dot={PAYMENT_DOT[status]} label={PAYMENT_STATUS_LABELS[status]} />
);
