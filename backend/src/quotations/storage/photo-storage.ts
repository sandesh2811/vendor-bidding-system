import type { Readable } from 'node:stream';

export interface StoredFile {
  stream: Readable;
  size: number;
}

/**
 * Storage port for quotation photos, also the DI token.
 * LocalPhotoStorage keeps files on disk; an object-storage adapter (S3, R2, ...) only has to
 * implement these methods and be bound in QuotationsModule instead.
 */
export abstract class PhotoStorage {
  /* stable key for an image: the same bytes for the same quotation always map to one key */
  abstract keyFor(
    quotationId: string,
    sha256: string,
    extension: string,
  ): string;

  /* must be atomic: a reader never sees a partially written object */
  abstract save(key: string, data: Buffer): Promise<void>;

  /* no error if the object is already gone */
  abstract remove(key: string): Promise<void>;

  /* null when the object doesn't exist */
  abstract open(key: string): Promise<StoredFile | null>;
}
