import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import type { Booking } from "../../types";

/* amount owed, paid so far, and what's still pending; one card each, compact rows on phones */
export function MoneySummary({ booking }: { booking: Pick<Booking, "amount" | "paidAmount" | "pendingAmount"> }) {
  const cards = [
    { label: "Booking amount", value: booking.amount },
    { label: "Paid", value: booking.paidAmount },
    { label: "Pending", value: booking.pendingAmount },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="gap-1 py-3 sm:py-4">
          <CardHeader className="flex items-baseline justify-between gap-4 px-4 sm:grid sm:px-5">
            <CardDescription>{card.label}</CardDescription>
            <CardTitle className="text-lg tabular-nums sm:text-xl">{formatMoney(card.value)}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
