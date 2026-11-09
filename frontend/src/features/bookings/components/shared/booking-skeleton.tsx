import { Skeleton } from "@/components/ui/skeleton";

export function BookingSkeleton({ className = "px-4 py-8 md:px-8" }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
