import type { Readable } from 'node:stream';

export interface StoredFile {
  stream: Readable;
  size: number;
}

/**
 * Storage port for quotation photos, injected with the PHOTO_STORAGE token.
 * LocalPhotoStorage keeps files on disk; an object-storage adapter (S3, R2, ...) only has to
 * implement this interface and be bound to PHOTO_STORAGE in QuotationsModule instead.
 */
export interface PhotoStorage {
  /* stable key for an image: the same bytes for the same quotation always map to one key */
  keyFor(quotationId: string, sha256: string, extension: string): string;

  /* must be atomic: a reader never sees a partially written object */
  save(key: string, data: Buffer): Promise<void>;

  /* no error if the object is already gone */
  remove(key: string): Promise<void>;

  /* null when the object doesn't exist */
  open(key: string): Promise<StoredFile | null>;
}

/* interfaces vanish at runtime, so DI needs a token of its own */
export const PHOTO_STORAGE = Symbol('PhotoStorage');
