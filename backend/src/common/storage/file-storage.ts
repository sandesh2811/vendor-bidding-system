import type { Readable } from 'node:stream';

export interface StoredFile {
  stream: Readable;
  size: number;
}

/* a stored file plus the content type recorded when it was uploaded, ready to stream to a client */
export interface TypedFile extends StoredFile {
  mimeType: string;
}

/**
 * Storage port for uploaded files (quotation photos, vendor payment QR codes), injected with the
 * FILE_STORAGE token. Callers own their key layout (e.g. `quotations/<id>/<sha256>.jpg`).
 * LocalFileStorage keeps files on disk; an object-storage adapter (S3, R2, ...) only has to
 * implement this interface and be bound to FILE_STORAGE in StorageModule instead.
 */
export interface FileStorage {
  /* must be atomic: a reader never sees a partially written object */
  save(key: string, data: Buffer): Promise<void>;

  /* no error if the object is already gone */
  remove(key: string): Promise<void>;

  /* null when the object doesn't exist */
  open(key: string): Promise<StoredFile | null>;
}

/* interfaces vanish at runtime, so DI needs a token of its own */
export const FILE_STORAGE = Symbol('FileStorage');
