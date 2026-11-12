import { StreamableFile } from '@nestjs/common';
import type { TypedFile } from './file-storage';

export const toStreamableFile = ({
  stream,
  size,
  mimeType,
}: TypedFile): StreamableFile =>
  new StreamableFile(stream, {
    type: mimeType,
    length: size,
    disposition: 'inline',
  });
