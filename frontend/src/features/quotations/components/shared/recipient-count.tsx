import { Badge } from "@/components/ui/badge";

/* "3 vendors", or a Draft badge for a quotation not sent to anyone yet */
export function RecipientCount({ count }: { count: number }) {
  if (!count)
    return (
      <Badge variant="outline" className="font-normal text-muted-foreground">
        Draft
      </Badge>
    );
  return (
    <span className="tabular-nums">
      {count} vendor{count === 1 ? "" : "s"}
    </span>
  );
}
