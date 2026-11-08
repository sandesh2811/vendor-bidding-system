"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRetainedValue } from "@/hooks/use-retained-value";
import type { GridPhoto } from "./photo-grid";

/* one photo at full size; closing keeps the image on screen while the dialog animates out */
export function PhotoLightbox({ photo, onClose }: { photo: GridPhoto | null; onClose: () => void }) {
  const shown = useRetainedValue(photo);

  return (
    <Dialog open={photo !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="gap-3 sm:max-w-3xl">
        <DialogHeader className="pr-8">
          <DialogTitle className="truncate">{shown?.name}</DialogTitle>
          <DialogDescription className="sr-only">Reference photo</DialogDescription>
        </DialogHeader>
        {shown && (
          <div className="relative h-[70svh] overflow-hidden rounded-lg bg-muted">
            {/* unoptimized: the browser fetches it directly, with the session cookie the API requires */}
            <Image src={shown.src} alt={shown.name} fill unoptimized className="object-contain" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
