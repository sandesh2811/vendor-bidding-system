import type { ReactNode } from "react";
import { SectionCard } from "@/components/layout/section-card";
import { type GridPhoto, PhotoGrid } from "./photo-grid";

/* the reference photos block of a quotation page; editing pages pass an add action and onRemove */
export function PhotosSection({
  photos,
  description,
  action,
  onRemove,
  removingId,
}: {
  photos: GridPhoto[];
  description?: ReactNode;
  action?: ReactNode;
  onRemove?: (photo: GridPhoto) => void;
  removingId?: string | null;
}) {
  return (
    <SectionCard title="Reference photos" description={description} action={action}>
      <PhotoGrid photos={photos} onRemove={onRemove} removingId={removingId} />
    </SectionCard>
  );
}
