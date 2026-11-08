"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/layout/confirm-dialog";
import { quotationPhotoUrl } from "../../api/quotations.api";
import { PHOTO_LIMITS } from "../../constants";
import { useRemovePhoto, useUploadPhotos } from "../../hooks/use-quotation-mutations";
import type { QuotationPhoto } from "../../types";
import { PHOTO_RULES } from "../../utils/photo-files";
import { AddPhotosButton } from "../shared/add-photos-button";
import type { GridPhoto } from "../shared/photo-grid";
import { PhotosSection } from "../shared/photos-section";

/* the admin's photo block: upload more (deduplicated by the API) and remove with confirmation */
export function ManagedPhotosSection({ quotationId, photos }: { quotationId: string; photos: QuotationPhoto[] }) {
  const upload = useUploadPhotos(quotationId);
  const remove = useRemovePhoto(quotationId);
  const [removing, setRemoving] = useState<GridPhoto | null>(null);

  const gridPhotos = photos.map((photo) => ({ id: photo.id, src: quotationPhotoUrl(photo), name: photo.originalName }));

  function confirmRemove() {
    if (!removing) return;
    remove.mutate(removing.id, {
      onSuccess: () => {
        toast.success("Photo removed");
        setRemoving(null);
      },
    });
  }

  return (
    <>
      <PhotosSection
        photos={gridPhotos}
        description={PHOTO_RULES}
        action={
          <AddPhotosButton
            room={PHOTO_LIMITS.MAX_PER_QUOTATION - photos.length}
            pending={upload.isPending}
            onAdd={(files) =>
              upload.mutate(files, {
                onSuccess: (added) => toast.success(`${added.length} photo${added.length === 1 ? "" : "s"} added`),
              })
            }
          />
        }
        onRemove={setRemoving}
        removingId={remove.isPending ? removing?.id : null}
      />
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Remove this photo?"
        description="Vendors who have this request won't see it any more."
        confirmLabel="Remove"
        destructive
        pending={remove.isPending}
        onConfirm={confirmRemove}
      />
    </>
  );
}
