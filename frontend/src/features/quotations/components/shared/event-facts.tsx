import { CalendarDaysIcon, ClockIcon, MapPinIcon, UsersIcon } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { formatDay } from "@/lib/dates";
import type { QuotationEvent } from "../../types";
import { DeadlineHint } from "./deadline-hint";

function Fact({ icon: Icon, label, children }: { icon: ComponentType<{ className?: string }>; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="text-sm font-medium break-words">{children}</dd>
      </div>
    </div>
  );
}

/* the event at a glance; optional facts are left out rather than shown empty */
export function EventFacts({ quotation }: { quotation: QuotationEvent }) {
  return (
    <dl className="grid gap-5 sm:grid-cols-2">
      <Fact icon={CalendarDaysIcon} label="Event date">
        {formatDay(quotation.eventDate)}
      </Fact>
      <Fact icon={MapPinIcon} label="Location">
        {quotation.location}
      </Fact>
      {quotation.guestCount !== null && (
        <Fact icon={UsersIcon} label="Guests">
          <span className="tabular-nums">{quotation.guestCount.toLocaleString()}</span>
        </Fact>
      )}
      {quotation.responseDeadline && (
        <Fact icon={ClockIcon} label="Respond by">
          {formatDay(quotation.responseDeadline)} <DeadlineHint deadline={quotation.responseDeadline} className="ml-1" />
        </Fact>
      )}
    </dl>
  );
}
