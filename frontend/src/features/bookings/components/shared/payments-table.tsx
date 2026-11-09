import type { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDay } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "../../constants";
import type { Payment } from "../../types";

/* payment history, newest first; the note column and a per-row action are admin-only */
export function PaymentsTable({
  payments,
  showNote = false,
  action,
}: {
  payments: Payment[];
  showNote?: boolean;
  action?: (payment: Payment) => ReactNode;
}) {
  if (!payments.length) return <p className="px-6 text-sm text-muted-foreground">No payments recorded yet.</p>;

  return (
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-6 text-xs text-muted-foreground">Date</TableHead>
          <TableHead className="text-right text-xs text-muted-foreground">Amount</TableHead>
          <TableHead className="text-xs text-muted-foreground">Method</TableHead>
          <TableHead className="text-xs text-muted-foreground">Reference</TableHead>
          {showNote && <TableHead className="text-xs text-muted-foreground">Note</TableHead>}
          {action && (
            <TableHead className="pr-6">
              <span className="sr-only">Actions</span>
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id} className="hover:bg-transparent">
            <TableCell className="pl-6 tabular-nums">{formatDay(payment.paidAt)}</TableCell>
            <TableCell className="text-right font-medium tabular-nums">{formatMoney(payment.amount)}</TableCell>
            <TableCell>{PAYMENT_METHOD_LABELS[payment.method]}</TableCell>
            <TableCell className="text-muted-foreground">{payment.reference ?? "—"}</TableCell>
            {showNote && (
              <TableCell className="max-w-64 whitespace-normal text-muted-foreground">{payment.note ?? "—"}</TableCell>
            )}
            {action && <TableCell className="pr-6 text-right">{action(payment)}</TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
