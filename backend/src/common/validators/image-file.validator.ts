import { FileValidator } from '@nestjs/common';
import { detectImageType } from '../image-type';

/* the subset of a multer file the upload routes rely on (memory storage) */
export interface UploadedFileData {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/* ParseFilePipe validator: accepts only JPEG, PNG or WebP, judged by the file's bytes */
export class ImageFileValidator extends FileValidator<
  Record<string, never>,
  UploadedFileData
> {
  constructor() {
    super({});
  }

  isValid(file?: UploadedFileData): boolean {
    return Boolean(file?.buffer && detectImageType(file.buffer));
  }

  buildErrorMessage(file?: UploadedFileData): string {
    return `${file?.originalname ?? 'File'} is not a JPEG, PNG or WebP image`;
  }
}
