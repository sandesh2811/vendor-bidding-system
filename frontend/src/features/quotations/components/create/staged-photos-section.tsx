"use client";

import { useObjectUrls } from "@/hooks/use-object-urls";
import { PHOTO_LIMITS } from "../../constants";
import { PHOTO_RULES } from "../../utils/photo-files";
import { AddPhotosButton } from "../shared/add-photos-button";
import { PhotosSection } from "../shared/photos-section";

const fileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

/* photos chosen on the create page, previewed locally and uploaded once the quotation is saved */
export function StagedPhotosSection({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  const urls = useObjectUrls(files);
  const photos = files.map((file, index) => ({ id: fileKey(file), src: urls[index], name: file.name }));

  return (
    <PhotosSection
      photos={photos}
      description={PHOTO_RULES}
      action={
        <AddPhotosButton
          room={PHOTO_LIMITS.MAX_PER_QUOTATION - files.length}
          staged={files}
          onAdd={(added) => onChange([...files, ...added])}
        />
      }
      onRemove={(photo) => onChange(files.filter((file) => fileKey(file) !== photo.id))}
    />
  );
}
