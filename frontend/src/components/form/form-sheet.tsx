"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/* side sheet holding one form: header, scrolling body, and a footer with Cancel plus the given actions */
export function FormSheet({
  open,
  onOpenChange,
  title,
  badge,
  description,
  children,
  actions,
  footerStart,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /* status shown beside the title */
  badge?: ReactNode;
  description: ReactNode;
  children: ReactNode;
  /* primary action(s), right of Cancel */
  actions: ReactNode;
  /* secondary action pushed to the footer's left edge */
  footerStart?: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b px-6 py-5">
          <div className="flex items-center gap-2 pr-8">
            <SheetTitle className="truncate text-base">{title}</SheetTitle>
            {badge}
          </div>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>

        <SheetFooter className="border-t px-6 py-4">
          <div className="flex items-center justify-end gap-2">
            {footerStart && <div className="mr-auto">{footerStart}</div>}
            <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
            {actions}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
