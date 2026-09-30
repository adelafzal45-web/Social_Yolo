import { promises as fs } from 'fs';
import { BadRequestException } from '@nestjs/common';

/**
 * Minimal shape of what NestJS / Express multer produces.
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

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB limit

/**
 * Validates image buffer magic bytes to prevent MIME spoofing and malicious file execution.
 */
export function validateImageMagicBytes(
  buffer: Buffer,
): 'jpeg' | 'png' | 'webp' {
  if (!buffer || buffer.length < 12) {
    throw new BadRequestException(
      'File is too small or corrupted to be a valid image.',
    );
  }

  // Check PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png';
  }

  // Check JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg';
  }

  // Check WebP: RIFF (bytes 0-3) + WEBP (bytes 8-11)
  if (
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46 && // F
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50 // P
  ) {
    return 'webp';
  }

  throw new BadRequestException(
    'MIME spoofing detected or unsupported file format. Only authentic JPG, PNG, and WebP files are allowed.',
  );
}

/**
 * Validates file extension, size, and magic bytes before returning the buffer.
 */
export async function validateAndReadImageBuffer(
  file: UploadedFile,
): Promise<Buffer> {
  if (!file) {
    throw new BadRequestException('No image file provided.');
  }

  // Sanitize filename and prevent path traversal
  const cleanName = (file.originalname || '').toLowerCase().trim();
  if (
    cleanName.includes('..') ||
    cleanName.includes('/') ||
    cleanName.includes('\\')
  ) {
    throw new BadRequestException(
      'Invalid filename. Path traversal characters are not permitted.',
    );
  }

  const hasAllowedExt = ALLOWED_EXTENSIONS.some((ext) =>
    cleanName.endsWith(ext),
  );
  if (!hasAllowedExt) {
    throw new BadRequestException(
      `Invalid file extension. Allowed extensions are: ${ALLOWED_EXTENSIONS.join(', ')}`,
    );
  }

  let buffer: Buffer;
  if (file.buffer) {
    buffer = file.buffer;
  } else if (file.path) {
    buffer = await fs.readFile(file.path);
  } else {
    throw new BadRequestException('Uploaded file content could not be read.');
  }

  if (buffer.length > MAX_PHOTO_BYTES) {
    throw new BadRequestException(
      `File size exceeds maximum allowed limit of ${MAX_PHOTO_BYTES / (1024 * 1024)} MB.`,
    );
  }

  // Verify magic bytes
  validateImageMagicBytes(buffer);

  return buffer;
}

/** Reads an `UploadedFile` into a `Buffer`, performing full security validation. */
export async function readFileBuffer(file: UploadedFile): Promise<Buffer> {
  return validateAndReadImageBuffer(file);
}
