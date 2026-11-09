import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../config/env.validation';
import type { PhotoStorage, StoredFile } from './photo-storage';

/* PhotoStorage on local disk: keys are paths under UPLOAD_DIR, e.g. quotations/<quotationId>/<sha256>.jpg */
@Injectable()
export class LocalPhotoStorage implements PhotoStorage {
  private readonly logger = new Logger(LocalPhotoStorage.name);
  private readonly root: string;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    this.root = resolve(config.get('UPLOAD_DIR', { infer: true }));
  }

  keyFor(quotationId: string, sha256: string, extension: string): string {
    return ['quotations', quotationId, `${sha256}.${extension}`].join('/');
  }

  /* write to a temp file then rename: readers never see a half-written image */
  async save(key: string, data: Buffer): Promise<void> {
    const target = this.absolute(key);
    const temp = `${target}.${randomUUID()}.tmp`;

    await mkdir(dirname(target), { recursive: true });
    await writeFile(temp, data);
    await rename(temp, target);
  }

  async remove(key: string): Promise<void> {
    await rm(this.absolute(key), { force: true });
  }

  async open(key: string): Promise<StoredFile | null> {
    const file = this.absolute(key);
    const info = await stat(file).catch(() => null);

    if (!info?.isFile()) {
      this.logger.warn({
        method: 'open',
        message: 'Photo file missing on disk',
        key,
      });
      return null;
    }

    return { stream: createReadStream(file), size: info.size };
  }

  /* keys come from the DB, but still must not escape the upload root */
  private absolute(key: string): string {
    const file = resolve(join(this.root, key));
    if (!file.startsWith(this.root + sep))
      throw new Error('Storage key escapes the upload directory');

    return file;
  }
}
