"use client";

import { ImagePlusIcon } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { PendingButton } from "@/components/form/pending-button";
import { PHOTO_LIMITS } from "../../constants";
import { screenPhotos } from "../../utils/photo-files";

/* opens the file picker and hands back the files that pass the client-side checks; problems go to a toast */
export function AddPhotosButton({
  room,
  staged,
  onAdd,
  pending = false,
}: {
  /* how many more photos fit on the quotation */
  room: number;
  /* files already chosen but not uploaded, skipped if picked again */
  staged?: File[];
  onAdd: (files: File[]) => void;
  pending?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);

  function onPick(files: FileList | null) {
    const { accepted, problems } = screenPhotos(Array.from(files ?? []), room, staged);
    if (problems.length) toast.warning(problems.join(". "));
    if (accepted.length) onAdd(accepted);
    /* clear so picking the same file again still fires change */
    if (input.current) input.current.value = "";
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept={PHOTO_LIMITS.TYPES.join(",")}
        multiple
        hidden
        onChange={(e) => onPick(e.target.files)}
      />
      <PendingButton
        type="button"
        variant="outline"
        size="sm"
        pending={pending}
        disabled={room <= 0}
        onClick={() => input.current?.click()}
      >
        {!pending && <ImagePlusIcon data-icon="inline-start" />}
        Add photos
      </PendingButton>
    </>
  );
}
