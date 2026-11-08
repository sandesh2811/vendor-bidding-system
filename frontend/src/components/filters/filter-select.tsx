"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* a single-choice list filter; `items` maps each value to its label, in display order */
export function FilterSelect<TValue extends string>({
  items,
  value,
  onChange,
  label,
  className,
}: {
  items: Record<TValue, string>;
  value: TValue;
  onChange: (value: TValue) => void;
  label: string;
  className?: string;
}) {
  return (
    <Select items={items} value={value} onValueChange={(next) => onChange(next as TValue)}>
      <SelectTrigger aria-label={label} className={cn("min-w-0 flex-1 sm:flex-none", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(items) as [TValue, string][]).map(([option, text]) => (
          <SelectItem key={option} value={option}>
            {text}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
