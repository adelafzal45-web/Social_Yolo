const QA_CONFIG = {
  minCoverage: 0.005,
  hazeFrac: 0.15,
  minMaxAlpha: 32,
  minTransparentFrac: 0.01,
  maxMinAlpha: 250,
  maxBorderOpaqueFrac: 0.4,
  minOpaqueFrac: 0.02,
  maxTransitionBandFrac: 0.6,
};

export type Verdict =
  | 'OK'
  | 'EMPTY_SUBJECT'
  | 'NO_REMOVAL'
  | 'POSSIBLE_REMNANT'
  | 'LOW_CONFIDENCE';

export interface QualityReport {
  coverage: number;
  opaqueFrac: number;
  transparentFrac: number;
  transitionBandFrac: number;
  hazeFrac: number;
  borderOpaqueFrac: number;
  minAlpha: number;
  maxAlpha: number;
  verdict: Verdict;
  details?: string;
}

export interface QaConfig {
  minCoverage?: number;
  hazeFrac?: number;
  minMaxAlpha?: number;
  minTransparentFrac?: number;
  maxMinAlpha?: number;
  maxBorderOpaqueFrac?: number;
  minOpaqueFrac?: number;
  maxTransitionBandFrac?: number;
}

/**
 * Evaluates quality metrics and determines an actionable matte verdict.
 *
 * Verdicts:
 * - EMPTY_SUBJECT: Primary matte failed to detect or preserve any subject (drives BRIA fallback).
 * - NO_REMOVAL: Entire background remained opaque or transparency is near-zero (drives BRIA fallback).
 * - POSSIBLE_REMNANT: High mid-alpha spread indicates background artifacts / haze (logged only).
 * - LOW_CONFIDENCE: Opaque pixels heavily hug the border or subject is overwhelmingly ambiguous transition.
 * - OK: High-quality, balanced matte.
 */
export function decideVerdict(
  report: Omit<QualityReport, 'verdict' | 'details'>,
  cfg?: Partial<QaConfig>,
): { verdict: Verdict; details: string } {
  const thresholds = { ...QA_CONFIG, ...cfg };
  const minCoverage = cfg?.minCoverage ?? QA_CONFIG.minCoverage;
  const maxHaze = cfg?.hazeFrac ?? QA_CONFIG.hazeFrac;

  if (
    report.coverage < minCoverage ||
    report.maxAlpha < thresholds.minMaxAlpha
  ) {
    return {
      verdict: 'EMPTY_SUBJECT',
      details: `Subject coverage (${(report.coverage * 100).toFixed(2)}%) or maxAlpha (${report.maxAlpha}) is below minimum subject threshold.`,
    };
  }

  if (
    report.transparentFrac < thresholds.minTransparentFrac ||
    report.minAlpha > thresholds.maxMinAlpha
  ) {
    return {
      verdict: 'NO_REMOVAL',
      details: `Transparent fraction (${(report.transparentFrac * 100).toFixed(2)}%) or minAlpha (${report.minAlpha}) indicates no background was removed.`,
    };
  }

  if (
    report.borderOpaqueFrac > thresholds.maxBorderOpaqueFrac ||
    (report.opaqueFrac < thresholds.minOpaqueFrac &&
      report.transitionBandFrac > thresholds.maxTransitionBandFrac)
  ) {
    return {
      verdict: 'LOW_CONFIDENCE',
      details: `Border clipping detected (${(report.borderOpaqueFrac * 100).toFixed(1)}% border opaque) or subject lacks solid core.`,
    };
  }

  if (report.hazeFrac > maxHaze) {
    return {
      verdict: 'POSSIBLE_REMNANT',
      details: `High mid-alpha haze (${(report.hazeFrac * 100).toFixed(1)}% of subject) suggests background color remnants.`,
    };
  }

  return {
    verdict: 'OK',
    details: 'Matte is clean, well-isolated, and ready for refinement.',
  };
}

/**
 * Performs a single histogram pass over the alpha channel to extract structural quality metrics.
 *
 * @param rgba Straight RGBA pixel buffer
 * @param width Raster width
 * @param height Raster height
 * @param cfg Quality thresholds
 */
export function analyzeMatte(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  cfg?: Partial<QaConfig>,
): QualityReport {
  const totalPixels = width * height;
  if (totalPixels === 0) {
    return {
      coverage: 0,
      opaqueFrac: 0,
      transparentFrac: 1,
      transitionBandFrac: 0,
      hazeFrac: 0,
      borderOpaqueFrac: 0,
      minAlpha: 0,
      maxAlpha: 0,
      verdict: 'EMPTY_SUBJECT',
      details: 'Image has 0 pixels.',
    };
  }

  const hist = new Uint32Array(256);
  let minAlpha = 255;
  let maxAlpha = 0;

  // Single pass over alpha values
  for (let i = 0; i < totalPixels; i++) {
    const a = rgba[i * 4 + 3];
    hist[a]++;
    if (a < minAlpha) minAlpha = a;
    if (a > maxAlpha) maxAlpha = a;
  }

  // Count border opaque pixels (alpha >= 250) along 1px boundary
  let borderOpaqueCount = 0;
  let totalBorderPixels = 0;

  for (let y = 0; y < height; y++) {
    const isEdgeRow = y === 0 || y === height - 1;
    const rowOffset = y * width;

    if (isEdgeRow) {
      for (let x = 0; x < width; x++) {
        totalBorderPixels++;
        if (rgba[(rowOffset + x) * 4 + 3] >= 250) {
          borderOpaqueCount++;
        }
      }
    } else {
      // Left border pixel
      totalBorderPixels++;
      if (rgba[rowOffset * 4 + 3] >= 250) {
        borderOpaqueCount++;
      }
      // Right border pixel (if width > 1)
      if (width > 1) {
        totalBorderPixels++;
        if (rgba[(rowOffset + width - 1) * 4 + 3] >= 250) {
          borderOpaqueCount++;
        }
      }
    }
  }

  // Metric sums
  const transparentCount = hist[0];
  let opaqueCount = 0;
  for (let a = 250; a <= 255; a++) {
    opaqueCount += hist[a];
  }

  let transitionCount = 0;
  for (let a = 1; a < 250; a++) {
    transitionCount += hist[a];
  }

  // Haze: spread across mid-alpha range [32, 220]
  let hazeCount = 0;
  for (let a = 32; a <= 220; a++) {
    hazeCount += hist[a];
  }

  const subjectCount = totalPixels - transparentCount;

  const coverage = subjectCount / totalPixels;
  const opaqueFrac = opaqueCount / totalPixels;
  const transparentFrac = transparentCount / totalPixels;
  const transitionBandFrac =
    subjectCount > 0 ? transitionCount / subjectCount : 0;
  const hazeFrac = subjectCount > 0 ? hazeCount / subjectCount : 0;
  const borderOpaqueFrac =
    totalBorderPixels > 0 ? borderOpaqueCount / totalBorderPixels : 0;

  const partialReport = {
    coverage,
    opaqueFrac,
    transparentFrac,
    transitionBandFrac,
    hazeFrac,
    borderOpaqueFrac,
    minAlpha,
    maxAlpha,
  };

  const { verdict, details } = decideVerdict(partialReport, cfg);

  return {
    ...partialReport,
    verdict,
    details,
  };
}
