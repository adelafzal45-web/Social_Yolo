/**
 * Image processing engine configuration.
 *
 * The background removal engine is now native Node.js using
 * @imgly/background-removal-node (ONNX runtime, no Python required).
 *
 * Legacy Python service config is kept here only for reference.
 * The ImageProcessingService no longer calls the Python service.
 */

/** @deprecated — Python microservice is replaced by native Node.js engine */
export const IMAGE_SERVICE_URL =
  process.env.IMAGE_SERVICE_URL || 'http://localhost:8000';

/** @deprecated — No longer used. Native Node.js engine processes in-memory. */
export const IMAGE_SERVICE_TIMEOUT_MS = Number(
  process.env.IMAGE_SERVICE_TIMEOUT_MS ?? 120_000,
);

/** Native Node.js engine model size: 'small' (fast) or 'medium' (quality) */
export const IMAGE_SERVICE_MODEL: 'small' | 'medium' =
  (process.env.IMAGE_SERVICE_MODEL as 'small' | 'medium') || 'small';
