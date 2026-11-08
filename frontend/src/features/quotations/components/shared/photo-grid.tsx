"use client";

import { ImageIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PhotoLightbox } from "./photo-lightbox";

/* a stored photo (API URL) or a staged upload (blob: URL), shown the same way */
export interface GridPhoto {
  id: string;
  src: string;
  name: string;
}

/* thumbnails that open full size; with `onRemove`, each gets a remove button */
export function PhotoGrid({
  photos,
  onRemove,
  removingId,
}: {
  photos: GridPhoto[];
  onRemove?: (photo: GridPhoto) => void;
  removingId?: string | null;
}) {
  const [viewing, setViewing] = useState<GridPhoto | null>(null);

  if (!photos.length)
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
        <ImageIcon className="size-4" />
        No photos yet
      </div>
    );

  return (
    <>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {photos.map((photo) => (
          <li key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
            <button
              type="button"
              onClick={() => setViewing(photo)}
              aria-label={`View ${photo.name}`}
              className="size-full focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Image src={photo.src} alt={photo.name} fill unoptimized className="object-cover transition-transform group-hover:scale-105" />
            </button>
            {onRemove && (
              <Button
                type="button"
                size="icon-xs"
                variant="secondary"
                aria-label={`Remove ${photo.name}`}
                disabled={removingId === photo.id}
                onClick={() => onRemove(photo)}
                className="absolute top-1.5 right-1.5 shadow-sm sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
              >
                {removingId === photo.id ? <Spinner /> : <XIcon />}
              </Button>
            )}
          </li>
        ))}
      </ul>
      <PhotoLightbox photo={viewing} onClose={() => setViewing(null)} />
    </>
  );
}
