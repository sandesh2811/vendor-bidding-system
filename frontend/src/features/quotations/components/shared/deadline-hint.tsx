import { daysUntil } from "@/lib/dates";
import { cn } from "@/lib/utils";

const describe = (days: number) => {
  if (days < 0) return "Closed";
  if (days === 0) return "Due today";
  return days === 1 ? "1 day left" : `${days} days left`;
};

/* "3 days left" next to a response deadline; urgent within two days, muted once closed */
export function DeadlineHint({ deadline, className }: { deadline: string; className?: string }) {
  const days = daysUntil(deadline);
  return (
    <span
      className={cn(
        "text-xs",
        days < 0 ? "text-muted-foreground" : days <= 2 ? "font-medium text-destructive" : "text-muted-foreground",
        className,
      )}
    >
      {describe(days)}
    </span>
  );
}
