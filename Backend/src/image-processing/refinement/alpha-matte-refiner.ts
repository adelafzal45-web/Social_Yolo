/** Environment-independent defaults keep the raster algorithms pure. */
const REFINE_CONFIG = {
  solidThresh: 230,
  decay: 0.9,
  maxRadius: 32,
  blackLo: 8,
  blackHi: 32,
  whiteLo: 232,
  whiteHi: 252,
  featherEnabled: false,
  featherSigma: 0.6,
};

export interface RefineConfig {
  solidThresh?: number;
  decay?: number;
  maxRadius?: number;
  blackLo?: number;
  blackHi?: number;
  whiteLo?: number;
  whiteHi?: number;
  featherEnabled?: boolean;
  featherSigma?: number;
}

export interface RefineResult {
  applied: boolean;
  stages: string[];
}

/** Feather is skipped when the transition band already exceeds this fraction of the subject. */
const FEATHER_MAX_BAND_FRAC = 0.2;

/**
 * Generates a 256-entry precomputed smoothstep lookup table (LUT) for alpha channel cleanup.
 *
 * Characteristics:
 * - Low-end toe [blackLo, blackHi]: pulls near-zero alpha noise smoothly down to 0.
 * - Midrange [blackHi, whiteLo]: exact mathematical identity (hair & soft translucent edges are untouched).
 * - High-end shoulder [whiteLo, whiteHi]: pushes near-solid alpha smoothly up to 255.
 * - Guaranteed monotonic across 0..255.
 */
export function createAlphaCurveLut(
  blackLo = 8,
  blackHi = 32,
  whiteLo = 232,
  whiteHi = 252,
): Uint8Array {
  const lut = new Uint8Array(256);

  for (let a = 0; a < 256; a++) {
    if (a <= blackLo) {
      lut[a] = 0;
    } else if (a >= whiteHi) {
      lut[a] = 255;
    } else if (a >= blackHi && a <= whiteLo) {
      lut[a] = a; // Midrange identity
    } else if (a > blackLo && a < blackHi) {
      const t = (a - blackLo) / (blackHi - blackLo);
      const s = t * t * (3 - 2 * t); // Cubic Hermite smoothstep
      lut[a] = Math.round(s * a);
    } else {
      // whiteLo < a < whiteHi
      const t = (a - whiteLo) / (whiteHi - whiteLo);
      const s = t * t * (3 - 2 * t);
      lut[a] = Math.round(a + s * (255 - a));
    }
  }

  // Safety guarantee: enforce strict non-decreasing monotonicity
  for (let a = 1; a < 256; a++) {
    if (lut[a] < lut[a - 1]) {
      lut[a] = lut[a - 1];
    }
  }

  return lut;
}

/** Alias for buildAlphaLut consuming RefineConfig */
export function buildAlphaLut(cfg?: Partial<RefineConfig>): Uint8Array {
  const blackLo = cfg?.blackLo ?? REFINE_CONFIG.blackLo;
  const blackHi = cfg?.blackHi ?? REFINE_CONFIG.blackHi;
  const whiteLo = cfg?.whiteLo ?? REFINE_CONFIG.whiteLo;
  const whiteHi = cfg?.whiteHi ?? REFINE_CONFIG.whiteHi;
  return createAlphaCurveLut(blackLo, blackHi, whiteLo, whiteHi);
}

/**
 * Conservative alpha cleanup via smoothstep LUT.
 *
 * Removes low-level noise without eroding hair or thin translucent contours.
 * Operates strictly on the alpha channel in-place.
 */
export function applyAlphaCurve(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  cfg?: Partial<RefineConfig>,
): void {
  const lut = buildAlphaLut(cfg);
  const totalPixels = width * height;

  for (let i = 0; i < totalPixels; i++) {
    const alphaIdx = (i << 2) + 3;
    rgba[alphaIdx] = lut[rgba[alphaIdx]];
  }
}

/**
 * Multi-source BFS edge color decontamination (halo & fringe removal).
 *
 * Solves the compositing error C_stored ≈ α·F + (1-α)·B_old.
 * Semi-transparent transition pixels on edges (hair, fur, thin geometry) carry
 * old background color. This function replaces contaminated RGB with true foreground
 * color F borrowed spatially from nearest solid foreground pixels.
 *
 * Invariants:
 * - Operates in place on straight RGBA.
 * - Solid pixels (α >= solidThresh) are trusted sources; their RGB is untouched.
 * - Background pixels (α == 0) are skipped.
 * - Alpha channel is NEVER modified by this function.
 * - Performance: bounds search strictly to the transition bounding box.
 *
 * @returns true if any transition pixel was repaired.
 */
export function decontaminateEdges(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  cfg?: Partial<RefineConfig>,
): boolean {
  const solidThresh = cfg?.solidThresh ?? REFINE_CONFIG.solidThresh;
  const maxRadius = Math.floor(cfg?.maxRadius ?? REFINE_CONFIG.maxRadius);
  const decay = cfg?.decay ?? REFINE_CONFIG.decay;
  if (maxRadius <= 0 || decay <= 0) return false;

  let minX = width,
    minY = height,
    maxX = -1,
    maxY = -1;
  let hasSolid = false;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = rgba[(y * width + x) * 4 + 3];
      if (a >= solidThresh) hasSolid = true;
      if (a > 0 && a < solidThresh) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (!hasSolid || maxX < minX) return false;
  const bw = maxX - minX + 1,
    bh = maxY - minY + 1;
  const count = bw * bh;
  const distance = new Int32Array(count);
  const queue = new Uint32Array(count);
  const colors = new Float32Array(count * 3);
  const confidence = new Float32Array(count);
  const contributions = new Uint8Array(count);
  let tail = 0;

  // Only original solid-alpha pixels seed the wavefront. RGB never classifies pixels.
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const alpha = rgba[(y * width + x) * 4 + 3];
      if (!alpha || alpha >= solidThresh) continue;
      const i = (y - minY) * bw + x - minX;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx,
            ny = y + dy;
          if ((!dx && !dy) || nx < 0 || nx >= width || ny < 0 || ny >= height)
            continue;
          const n = (ny * width + nx) * 4;
          if (rgba[n + 3] < solidThresh) continue;
          const weight = (rgba[n + 3] / 255) * decay;
          for (let c = 0; c < 3; c++) colors[i * 3 + c] += rgba[n + c] * weight;
          confidence[i] += weight;
          contributions[i]++;
        }
      if (confidence[i] > 0) {
        distance[i] = 1;
        queue[tail++] = i;
      }
    }
  }

  let head = 0;
  while (head < tail) {
    const levelEnd = tail;
    // Normalize all equal-distance contributions before propagating this level.
    for (let q = head; q < levelEnd; q++) {
      const i = queue[q];
      for (let c = 0; c < 3; c++) colors[i * 3 + c] /= confidence[i];
      confidence[i] /= contributions[i];
    }
    while (head < levelEnd) {
      const i = queue[head++],
        x = i % bw,
        y = Math.floor(i / bw);
      if (distance[i] >= maxRadius) continue;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx,
            ny = y + dy;
          if ((!dx && !dy) || nx < 0 || nx >= bw || ny < 0 || ny >= bh)
            continue;
          const n = ny * bw + nx;
          const alpha = rgba[((ny + minY) * width + nx + minX) * 4 + 3];
          if (
            !alpha ||
            alpha >= solidThresh ||
            (distance[n] && distance[n] !== distance[i] + 1)
          )
            continue;
          const weight = confidence[i] * decay;
          if (weight <= 0) continue;
          if (!distance[n]) {
            distance[n] = distance[i] + 1;
            queue[tail++] = n;
          }
          for (let c = 0; c < 3; c++)
            colors[n * 3 + c] += colors[i * 3 + c] * weight;
          confidence[n] += weight;
          contributions[n]++;
        }
    }
  }
  for (let q = 0; q < tail; q++) {
    const i = queue[q];
    const base = ((Math.floor(i / bw) + minY) * width + (i % bw) + minX) * 4;
    for (let c = 0; c < 3; c++) rgba[base + c] = Math.round(colors[i * 3 + c]);
  }
  return tail > 0;
}

/** Fill exactly the transparent ring a 3x3 alpha kernel can expose, before alpha changes. */
function extendFeatherColors(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
): void {
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const base = (y * width + x) * 4;
      if (rgba[base + 3]) continue;
      let r = 0,
        g = 0,
        b = 0,
        weight = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx,
            ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const n = (ny * width + nx) * 4;
          const a = rgba[n + 3] * (dx === 0 ? 2 : 1) * (dy === 0 ? 2 : 1);
          r += rgba[n] * a;
          g += rgba[n + 1] * a;
          b += rgba[n + 2] * a;
          weight += a;
        }
      if (weight) {
        rgba[base] = Math.round(r / weight);
        rgba[base + 1] = Math.round(g / weight);
        rgba[base + 2] = Math.round(b / weight);
      }
    }
}

/**
 * 3-tap separable [1, 2, 1]/4 blur on alpha channel only (sigma ≈ 0.6).
 *
 * Automatically skips when the subject's transition band is already soft (> 20% of subject),
 * ensuring fine hair is never artificially blurred.
 */
export function featherAlpha(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  cfg?: Partial<RefineConfig>,
): boolean {
  if (cfg?.featherEnabled !== true) {
    return false;
  }

  let subjectPixels = 0;
  let transitionPixels = 0;
  const totalPixels = width * height;
  const solidThresh = cfg?.solidThresh ?? REFINE_CONFIG.solidThresh;

  for (let i = 0; i < totalPixels; i++) {
    const a = rgba[(i << 2) + 3];
    if (a > 0) {
      subjectPixels++;
      if (a < solidThresh) {
        transitionPixels++;
      }
    }
  }

  if (subjectPixels === 0) {
    return false;
  }

  if (transitionPixels / subjectPixels > FEATHER_MAX_BAND_FRAC) {
    return false;
  }

  const alphaIn = new Uint8Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    alphaIn[i] = rgba[(i << 2) + 3];
  }

  const alphaH = new Uint8Array(totalPixels);

  // Horizontal pass: [1, 2, 1] / 4
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const left = x > 0 ? alphaIn[rowOffset + x - 1] : alphaIn[rowOffset + x];
      const mid = alphaIn[rowOffset + x];
      const right =
        x < width - 1 ? alphaIn[rowOffset + x + 1] : alphaIn[rowOffset + x];
      alphaH[rowOffset + x] = (left + (mid << 1) + right) >> 2;
    }
  }

  // Vertical pass: [1, 2, 1] / 4 back into rgba alpha channel
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    const prevRowOffset = y > 0 ? (y - 1) * width : rowOffset;
    const nextRowOffset = y < height - 1 ? (y + 1) * width : rowOffset;

    for (let x = 0; x < width; x++) {
      const top = alphaH[prevRowOffset + x];
      const mid = alphaH[rowOffset + x];
      const bot = alphaH[nextRowOffset + x];
      rgba[((rowOffset + x) << 2) + 3] = (top + (mid << 1) + bot) >> 2;
    }
  }

  return true;
}

/**
 * Orchestrates matte refinement in strict order:
 * 1. decontaminateEdges (RGB color bleed from solid foreground)
 * 2. applyAlphaCurve (conservative smoothstep LUT on alpha)
 * 3. featherAlpha (optional separable alpha blur)
 *
 * Sequence invariant: decontam MUST precede alpha curve so newly-trusted edge pixels
 * do not act as contaminated sources.
 */
export function refineMatte(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  cfg?: Partial<RefineConfig>,
): RefineResult {
  const stages: string[] = [];

  if (decontaminateEdges(rgba, width, height, cfg)) {
    stages.push('decontaminate');
  }

  if (cfg?.featherEnabled) extendFeatherColors(rgba, width, height);

  applyAlphaCurve(rgba, width, height, cfg);
  stages.push('alpha-curve');

  if (featherAlpha(rgba, width, height, cfg)) {
    stages.push('feather');
  }

  return {
    applied: stages.length > 0,
    stages,
  };
}
