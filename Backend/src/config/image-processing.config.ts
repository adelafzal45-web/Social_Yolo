import { resolve } from 'path';

/**
 * Validated configuration for Image Processing & Background Removal Pipeline.
 *
 * All settings are driven by environment variables with secure, robust defaults.
 */

function numberSetting(
  name: string,
  fallback: number,
  min: number,
  max: number,
  integer = false,
): number {
  const value = Number(process.env[name] ?? fallback);
  if (
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    (integer && !Number.isInteger(value))
  ) {
    throw new Error(
      name +
        ' must be ' +
        (integer ? 'an integer ' : 'a number ') +
        'between ' +
        min +
        ' and ' +
        max,
    );
  }
  return value;
}
function choice<T extends string>(
  name: string,
  fallback: T,
  values: readonly T[],
): T {
  const value = (process.env[name] || fallback).toLowerCase() as T;
  if (!values.includes(value))
    throw new Error(name + ' must be one of ' + values.join(', '));
  return value;
}
const enabled = (name: string, fallback: boolean) =>
  choice(name, String(fallback), ['true', 'false']) === 'true';

export const BG_REMOVAL_PROVIDER = choice('BG_REMOVAL_PROVIDER', 'imgly', [
  'imgly',
  'bria',
] as const);
export const IMGLY_MODEL = choice('IMGLY_MODEL', 'medium', [
  'small',
  'medium',
  'large',
] as const);
export const BG_REFINE_ENABLED = enabled('BG_REFINE_ENABLED', true);
export const BG_ANALYSIS_ENABLED = enabled('BG_ANALYSIS_ENABLED', true);
export const BG_FALLBACK_ENABLED = enabled('BG_FALLBACK_ENABLED', true);
/** Reserved: v1 always processes refinement inline. */
export const BG_REFINE_IN_WORKER = enabled('BG_REFINE_IN_WORKER', false);
export const FALLBACK = { enabled: BG_FALLBACK_ENABLED };

export const REFINE_CONFIG = {
  solidThresh: numberSetting('BG_REFINE_SOLID_THRESH', 230, 1, 255, true),
  decay: numberSetting('BG_REFINE_DECONTAM_DECAY', 0.9, 0.01, 1),
  maxRadius: numberSetting('BG_REFINE_DECONTAM_MAX_RADIUS', 32, 0, 256, true),
  blackLo: numberSetting('BG_REFINE_BLACK_LO', 8, 0, 39, true),
  blackHi: numberSetting('BG_REFINE_BLACK_HI', 32, 1, 40, true),
  whiteLo: numberSetting('BG_REFINE_WHITE_LO', 232, 41, 254, true),
  whiteHi: numberSetting('BG_REFINE_WHITE_HI', 252, 42, 255, true),
  featherEnabled: enabled('BG_REFINE_FEATHER_ENABLED', false),
  // v1 uses the fixed conservative 3-tap kernel; other sigma values are unsupported.
  featherSigma: numberSetting('BG_REFINE_FEATHER_SIGMA', 0.6, 0.6, 0.6),
};
if (
  !(
    REFINE_CONFIG.blackLo < REFINE_CONFIG.blackHi &&
    REFINE_CONFIG.whiteLo < REFINE_CONFIG.whiteHi
  )
) {
  throw new Error(
    'Alpha curve requires BLACK_LO < BLACK_HI and WHITE_LO < WHITE_HI',
  );
}

export const QA_CONFIG = {
  minCoverage: numberSetting('BG_QA_MIN_COVERAGE', 0.005, 0, 1),
  hazeFrac: numberSetting('BG_QA_HAZE_FRAC', 0.15, 0, 1),
  minMaxAlpha: numberSetting('BG_QA_MIN_MAX_ALPHA', 32, 0, 255, true),
  minTransparentFrac: numberSetting('BG_QA_MIN_TRANSPARENT_FRAC', 0.01, 0, 1),
  maxMinAlpha: numberSetting('BG_QA_MAX_MIN_ALPHA', 250, 0, 255, true),
  maxBorderOpaqueFrac: numberSetting('BG_QA_MAX_BORDER_OPAQUE_FRAC', 0.4, 0, 1),
  minOpaqueFrac: numberSetting('BG_QA_MIN_OPAQUE_FRAC', 0.02, 0, 1),
  maxTransitionBandFrac: numberSetting(
    'BG_QA_MAX_TRANSITION_BAND_FRAC',
    0.6,
    0,
    1,
  ),
};

export const MAX_FILE_SIZE_BYTES = Number(
  process.env.MAX_FILE_SIZE_BYTES ?? 10 * 1024 * 1024, // 10 MB default
);

export const ALLOWED_MIME_TYPES = (
  process.env.ALLOWED_MIME_TYPES ?? 'image/jpeg,image/png,image/webp'
)
  .split(',')
  .map((m) => m.trim().toLowerCase())
  .filter(Boolean);

export const MAX_IMAGE_WIDTH = Number(process.env.MAX_IMAGE_WIDTH ?? 4096);
export const MAX_IMAGE_HEIGHT = Number(process.env.MAX_IMAGE_HEIGHT ?? 4096);
export const MAX_TOTAL_PIXELS = Number(
  process.env.MAX_TOTAL_PIXELS ?? 4096 * 4096, // 16 megapixels max to avoid decompression bombs
);

export const MAX_CONCURRENT_JOBS = Number(process.env.MAX_CONCURRENT_JOBS ?? 2);

export const MAX_QUEUE_SIZE = Number(process.env.MAX_QUEUE_SIZE ?? 10);

export const PROCESSING_TIMEOUT_MS = Number(
  process.env.PROCESSING_TIMEOUT_MS ?? 60_000, // 60 seconds default timeout
);

export const OUTPUT_QUALITY = Number(process.env.OUTPUT_QUALITY ?? 90);

export const STORAGE_DIR = resolve(
  process.cwd(),
  process.env.STORAGE_DIR ?? 'storage/processed',
);

export const TEMP_DIR = resolve(
  process.cwd(),
  process.env.TEMP_DIR ?? 'storage/temp',
);

/** Authentication & RBAC Settings */
export const AUTH_REQUIRED =
  (process.env.AUTH_REQUIRED ?? 'true').toLowerCase() === 'true';

export const JWT_SECRET =
  process.env.JWT_SECRET ||
  'social-yolo-production-jwt-secret-key-replace-in-env-9821038472';

export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
