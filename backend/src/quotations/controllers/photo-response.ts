import { StreamableFile } from '@nestjs/common';
import type { PhotoFile } from '../quotations.service';

export const toStreamableFile = ({
  stream,
  size,
  mimeType,
}: PhotoFile): StreamableFile =>
  new StreamableFile(stream, {
    type: mimeType,
    length: size,
    disposition: 'inline',
  });
