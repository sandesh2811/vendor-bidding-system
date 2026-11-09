import { cn } from "@/lib/utils";

/* gold tile with navy initial, after the Mero Event logo colours */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex aspect-square shrink-0 items-center justify-center rounded-md bg-brand font-semibold text-brand-foreground",
        className,
      )}
    >
      M
    </span>
  );
}
