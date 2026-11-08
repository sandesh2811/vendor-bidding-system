/* magic-number sniffing for the image formats we accept; the client-sent mimetype is never trusted */
const SIGNATURES: { mimeType: string; matches: (b: Buffer) => boolean }[] = [
  {
    mimeType: 'image/jpeg',
    matches: (b) =>
      b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mimeType: 'image/png',
    matches: (b) =>
      b.length >= 8 &&
      b
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mimeType: 'image/webp',
    matches: (b) =>
      b.length >= 12 &&
      b.toString('ascii', 0, 4) === 'RIFF' &&
      b.toString('ascii', 8, 12) === 'WEBP',
  },
];

export const detectImageType = (buffer: Buffer): string | null =>
  SIGNATURES.find(({ matches }) => matches(buffer))?.mimeType ?? null;
