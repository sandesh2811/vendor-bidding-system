import { Badge } from "@/components/ui/badge";
import { EVENT_TYPE_LABELS, type EventType } from "../../constants";

export function EventTypeBadge({ eventType }: { eventType: EventType }) {
  return (
    <Badge variant="secondary" className="font-normal">
      {EVENT_TYPE_LABELS[eventType]}
    </Badge>
  );
}
