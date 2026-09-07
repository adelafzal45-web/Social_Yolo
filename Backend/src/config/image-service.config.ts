/**
 * Configuration helpers for the Python image-processing microservice.
 *
 * The Python FastAPI service (in `Social_Yolo/image-service/`) exposes
 * `POST /process-image` which removes backgrounds and enhances images.
 * The NestJS backend calls it via HTTP — see `ImageProcessingService`.
 */

export const IMAGE_SERVICE_URL =
  process.env.IMAGE_SERVICE_URL || 'http://localhost:8000';

/** Default timeout (ms) for a single image-processing request. */
export const IMAGE_SERVICE_TIMEOUT_MS =
  Number(process.env.IMAGE_SERVICE_TIMEOUT_MS ?? 30_000);
