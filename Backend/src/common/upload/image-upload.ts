import { promises as fs } from 'fs';
import { BadRequestException } from '@nestjs/common';

/**
 * Minimal shape of what NestJS / Express multer produces.
 *
 * When `FileInterceptor` is used without a custom `storage` option,
 * multer writes to disk and populates `path`; with `memoryStorage()`
 * it populates `buffer` instead. We support both.
 */
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
  size: number;
}

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB

/** Reads an `UploadedFile` into a `Buffer`, working with both disk and memory storage. */
export async function readFileBuffer(file: UploadedFile): Promise<Buffer> {
  if (file.buffer) {
    return file.buffer;
  }
  if (file.path) {
    return fs.readFile(file.path);
  }
  throw new BadRequestException('Uploaded file has no buffer or path.');
}
