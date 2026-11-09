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
  if (!payments.length)
    return <p className="px-4 pb-2 text-sm text-muted-foreground sm:px-6">No payments recorded yet.</p>;

  return (
    <>
      {/* phones: one stacked row per payment instead of a sideways-scrolling table */}
      <ul className="divide-y border-t sm:hidden">
        {payments.map((payment) => (
          <li key={payment.id} className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0 space-y-0.5">
              <p className="font-medium tabular-nums">{formatMoney(payment.amount)}</p>
              <p className="text-xs text-muted-foreground">
                {formatDay(payment.paidAt)} · {PAYMENT_METHOD_LABELS[payment.method]}
                {payment.reference && ` · ${payment.reference}`}
              </p>
              {showNote && payment.note && <p className="text-xs break-words text-muted-foreground">{payment.note}</p>}
            </div>
            {action?.(payment)}
          </li>
        ))}
      </ul>
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
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
                <TableCell className="text-muted-foreground">{payment.reference ?? "None"}</TableCell>
                {showNote && (
                  <TableCell className="max-w-64 whitespace-normal text-muted-foreground">
                    {payment.note ?? "None"}
                  </TableCell>
                )}
                {action && <TableCell className="pr-6 text-right">{action(payment)}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
