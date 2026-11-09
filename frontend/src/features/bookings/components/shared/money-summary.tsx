import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import type { Booking } from "../../types";

/* amount owed, paid so far, and what's still pending */
export function MoneySummary({ booking }: { booking: Pick<Booking, "amount" | "paidAmount" | "pendingAmount"> }) {
  const cards = [
    { label: "Booking amount", value: booking.amount },
    { label: "Paid", value: booking.paidAmount },
    { label: "Pending", value: booking.pendingAmount },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label} className="gap-1 py-4">
          <CardHeader className="px-5">
            <CardDescription>{card.label}</CardDescription>
            <CardTitle className="text-xl tabular-nums">{formatMoney(card.value)}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
