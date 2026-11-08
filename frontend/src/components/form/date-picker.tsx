"use client";

import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDay, fromDateOnly, toDateOnly } from "@/lib/dates";
import { cn } from "@/lib/utils";

/* picks a calendar day as YYYY-MM-DD; days outside [min, max] can't be chosen */
export function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  placeholder = "Pick a date",
  invalid,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? fromDateOnly(value) : undefined;
  const disabled = [
    ...(min ? [{ before: fromDateOnly(min) }] : []),
    ...(max ? [{ after: fromDateOnly(max) }] : []),
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            aria-invalid={invalid}
            className={cn("w-full justify-start font-normal", !value && "text-muted-foreground")}
          />
        }
      >
        <CalendarIcon data-icon="inline-start" />
        {value ? formatDay(value) : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? (min ? fromDateOnly(min) : undefined)}
          disabled={disabled}
          onSelect={(date) => {
            onChange(date ? toDateOnly(date) : "");
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
