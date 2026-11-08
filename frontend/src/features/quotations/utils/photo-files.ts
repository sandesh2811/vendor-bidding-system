import { PHOTO_LIMITS } from "../constants";

const MAX_MB = PHOTO_LIMITS.MAX_BYTES / 1024 / 1024;
const sameFile = (a: File, b: File) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

export interface ScreenedPhotos {
  accepted: File[];
  /* one human-readable reason per problem, for a toast */
  problems: string[];
}

/**
 * Early client-side check of picked files against the API's rules: type, size, and how many more
 * fit on the quotation (`room`). Files already in `staged` are skipped silently.
 */
export function screenPhotos(picked: File[], room: number, staged: File[] = []): ScreenedPhotos {
  const accepted: File[] = [];
  const problems: string[] = [];

  for (const file of picked) {
    if (staged.some((other) => sameFile(other, file)) || accepted.some((other) => sameFile(other, file))) continue;

    if (!(PHOTO_LIMITS.TYPES as readonly string[]).includes(file.type))
      problems.push(`${file.name} isn't a JPEG, PNG or WebP image`);
    else if (file.size > PHOTO_LIMITS.MAX_BYTES) problems.push(`${file.name} is larger than ${MAX_MB} MB`);
    else accepted.push(file);
  }

  if (accepted.length > room) {
    problems.push(
      room > 0
        ? `Only ${room} more photo${room === 1 ? "" : "s"} can be added (limit ${PHOTO_LIMITS.MAX_PER_QUOTATION})`
        : `A quotation can have at most ${PHOTO_LIMITS.MAX_PER_QUOTATION} photos`,
    );
    accepted.length = Math.max(room, 0);
  }

  return { accepted, problems };
}

export const PHOTO_RULES = `JPEG, PNG or WebP, up to ${MAX_MB} MB each and ${PHOTO_LIMITS.MAX_PER_QUOTATION} per quotation.`;
