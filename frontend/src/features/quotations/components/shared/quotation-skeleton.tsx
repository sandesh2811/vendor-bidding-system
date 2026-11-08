import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function BlockSkeleton({ lines }: { lines: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-56" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

/* placeholder for the quotation detail and edit pages: title block plus the two-column layout */
export function QuotationSkeleton({ className = "px-4 py-8 md:px-8" }: { className?: string }) {
  return (
    <div className={className} aria-busy aria-label="Loading quotation">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-7 w-72 max-w-full" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-6">
          <BlockSkeleton lines={3} />
          <BlockSkeleton lines={4} />
        </div>
        <BlockSkeleton lines={2} />
      </div>
    </div>
  );
}
