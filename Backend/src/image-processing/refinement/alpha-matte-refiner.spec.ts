import {
  createAlphaCurveLut,
  applyAlphaCurve,
  decontaminateEdges,
  featherAlpha,
  refineMatte,
} from './alpha-matte-refiner';

describe('AlphaMatteRefiner (Pure Algorithms)', () => {
  describe('createAlphaCurveLut', () => {
    it('should generate a strictly monotonic LUT across all 256 values', () => {
      const lut = createAlphaCurveLut(8, 32, 232, 252);
      expect(lut.length).toBe(256);

      for (let i = 1; i < 256; i++) {
        expect(lut[i]).toBeGreaterThanOrEqual(lut[i - 1]);
      }
    });

    it('should provide strict identity for midtones [32, 232] to protect fine hair', () => {
      const lut = createAlphaCurveLut(8, 32, 232, 252);

      for (let i = 32; i <= 232; i++) {
        expect(lut[i]).toBe(i);
      }
    });

    it('should clamp low-alpha noise below blackLo to 0', () => {
      const lut = createAlphaCurveLut(8, 32, 232, 252);
      for (let i = 0; i <= 8; i++) {
        expect(lut[i]).toBe(0);
      }
    });

    it('should clamp high-alpha shoulder above whiteHi to 255', () => {
      const lut = createAlphaCurveLut(8, 32, 232, 252);
      for (let i = 252; i <= 255; i++) {
        expect(lut[i]).toBe(255);
      }
    });
  });

  describe('applyAlphaCurve', () => {
    it('should modify only alpha values and preserve RGB channels entirely', () => {
      // 2x1 pixel raster: [R, G, B, A, R, G, B, A]
      const rgba = new Uint8ClampedArray([
        100,
        150,
        200,
        5, // Alpha 5 should pull to 0
        100,
        150,
        200,
        254, // Alpha 254 should push to 255
      ]);

      applyAlphaCurve(rgba, 2, 1, {
        blackLo: 8,
        blackHi: 32,
        whiteLo: 232,
        whiteHi: 252,
      });

      // RGB intact
      expect(rgba[0]).toBe(100);
      expect(rgba[1]).toBe(150);
      expect(rgba[2]).toBe(200);
      expect(rgba[4]).toBe(100);
      expect(rgba[5]).toBe(150);
      expect(rgba[6]).toBe(200);

      // Alpha adjusted
      expect(rgba[3]).toBe(0);
      expect(rgba[7]).toBe(255);
    });
  });

  describe('decontaminateEdges', () => {
    it('should replace contaminated transition RGB with neighbor foreground and keep alpha unchanged', () => {
      // 4x1 raster:
      // Pixel 0: Solid foreground (Red: 255, 0, 0, A: 255)
      // Pixel 1: Transition pixel contaminated with Green bg (R: 0, G: 255, B: 0, A: 128)
      // Pixel 2: Transition pixel contaminated with Green bg (R: 0, G: 255, B: 0, A: 64)
      // Pixel 3: Background (R: 0, G: 255, B: 0, A: 0)
      const rgba = new Uint8ClampedArray([
        255, 0, 0, 255, 0, 255, 0, 128, 0, 255, 0, 64, 0, 255, 0, 0,
      ]);

      decontaminateEdges(rgba, 4, 1, {
        solidThresh: 230,
        decay: 1.0,
        maxRadius: 32,
      });

      // Pixel 0 (solid): unchanged
      expect(rgba[0]).toBe(255);
      expect(rgba[1]).toBe(0);
      expect(rgba[2]).toBe(0);
      expect(rgba[3]).toBe(255);

      // Pixel 1 (transition d=1): RGB replaced with foreground Red, alpha unchanged
      expect(rgba[4]).toBe(255);
      expect(rgba[5]).toBe(0);
      expect(rgba[6]).toBe(0);
      expect(rgba[7]).toBe(128);

      // Pixel 2 (transition d=2): RGB replaced with foreground Red, alpha unchanged
      expect(rgba[8]).toBe(255);
      expect(rgba[9]).toBe(0);
      expect(rgba[10]).toBe(0);
      expect(rgba[11]).toBe(64);

      // Pixel 3 (background): untouched
      expect(rgba[12]).toBe(0);
      expect(rgba[13]).toBe(255);
      expect(rgba[14]).toBe(0);
      expect(rgba[15]).toBe(0);
    });

    it('should be idempotent: repeated runs produce identical RGBA', () => {
      const rgba = new Uint8ClampedArray([
        200, 100, 50, 255, 10, 200, 10, 150, 10, 200, 10, 80, 0, 0, 0, 0,
      ]);

      decontaminateEdges(rgba, 4, 1, { solidThresh: 230, maxRadius: 10 });
      const pass1 = new Uint8ClampedArray(rgba);

      decontaminateEdges(rgba, 4, 1, { solidThresh: 230, maxRadius: 10 });
      expect(Array.from(rgba)).toEqual(Array.from(pass1));
    });

    it('should be a no-op on fully solid and fully transparent images', () => {
      const solid = new Uint8ClampedArray([255, 0, 0, 255, 255, 0, 0, 255]);
      decontaminateEdges(solid, 2, 1);
      expect(Array.from(solid)).toEqual([255, 0, 0, 255, 255, 0, 0, 255]);

      const transparent = new Uint8ClampedArray([0, 0, 0, 0, 0, 0, 0, 0]);
      decontaminateEdges(transparent, 2, 1);
      expect(Array.from(transparent)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    });
  });

  describe('featherAlpha', () => {
    it('should auto-skip feathering when transition band is already soft (> 20% of subject)', () => {
      // 5 pixels: 1 solid (255), 4 transition (128). Transition / Subject = 4/5 = 80% > 20%
      const rgba = new Uint8ClampedArray([
        255, 0, 0, 255, 255, 0, 0, 128, 255, 0, 0, 128, 255, 0, 0, 128, 255, 0,
        0, 128,
      ]);

      const applied = featherAlpha(rgba, 5, 1, { featherEnabled: true });
      expect(applied).toBe(false);
    });

    it('should return false when featherEnabled is false', () => {
      const rgba = new Uint8ClampedArray([255, 255, 255, 255]);
      const applied = featherAlpha(rgba, 1, 1, { featherEnabled: false });
      expect(applied).toBe(false);
    });
  });

  describe('refineMatte', () => {
    it('should execute stages in strict order: decontaminate -> alpha-curve', () => {
      const rgba = new Uint8ClampedArray([
        255,
        0,
        0,
        255,
        0,
        255,
        0,
        5, // transition with noise alpha
      ]);

      const result = refineMatte(rgba, 2, 1, {
        solidThresh: 230,
        blackLo: 8,
        blackHi: 32,
        featherEnabled: false,
      });

      expect(result.applied).toBe(true);
      expect(result.stages).toEqual(['decontaminate', 'alpha-curve']);

      // Transition pixel received Red from solid neighbor during decontam,
      // and its alpha 5 was subsequently pulled to 0 during alpha-curve
      expect(rgba[4]).toBe(255);
      expect(rgba[7]).toBe(0);
    });
  });
});

describe('Conservative edge regression cases', () => {
  it('never increases toe alpha or decreases shoulder alpha', () => {
    const lut = createAlphaCurveLut();
    for (let a = 0; a < 32; a++) expect(lut[a]).toBeLessThanOrEqual(a);
    for (let a = 232; a < 256; a++) expect(lut[a]).toBeGreaterThanOrEqual(a);
  });
  it('honors zero and one-pixel radius limits', () => {
    const original = new Uint8ClampedArray([
      200, 0, 0, 255, 0, 200, 0, 128, 0, 200, 0, 128,
    ]);
    const rgba = original.slice();
    expect(decontaminateEdges(rgba, 3, 1, { maxRadius: 0 })).toBe(false);
    expect(rgba).toEqual(original);
    decontaminateEdges(rgba, 3, 1, { maxRadius: 1 });
    expect(Array.from(rgba.slice(4, 7))).toEqual([200, 0, 0]);
    expect(rgba.slice(8)).toEqual(original.slice(8));
  });
  it('weights equal-distance trusted colors by alpha confidence', () => {
    const rgba = new Uint8ClampedArray([
      255, 0, 0, 255, 0, 255, 0, 128, 0, 0, 255, 230,
    ]);
    decontaminateEdges(rgba, 3, 1, { decay: 0.9 });
    expect(rgba[4]).toBe(Math.round((255 * 255) / 485));
    expect(rgba[6]).toBe(Math.round((255 * 230) / 485));
    expect(rgba[7]).toBe(128);
  });
  it('uses diagonal seeds but never crosses fully transparent gaps', () => {
    const rgba = new Uint8ClampedArray(3 * 3 * 4);
    rgba.set([200, 20, 10, 255], 0);
    rgba.set([0, 255, 0, 128], 16);
    decontaminateEdges(rgba, 3, 3);
    expect(Array.from(rgba.slice(16, 20))).toEqual([200, 20, 10, 128]);
    const gap = new Uint8ClampedArray([
      200, 20, 10, 255, 0, 0, 0, 0, 0, 255, 0, 128,
    ]);
    const before = gap.slice();
    decontaminateEdges(gap, 3, 1);
    expect(gap).toEqual(before);
  });
  it('fills feather-exposed background RGB before adding alpha', () => {
    const rgba = new Uint8ClampedArray([
      255, 255, 255, 0, 180, 20, 10, 255, 255, 255, 255, 0,
    ]);
    const result = refineMatte(rgba, 3, 1, { featherEnabled: true });
    expect(result.stages).toContain('feather');
    expect(rgba[3]).toBeGreaterThan(0);
    expect(Array.from(rgba.slice(0, 3))).toEqual([180, 20, 10]);
    expect(Array.from(rgba.slice(8, 11))).toEqual([180, 20, 10]);
  });
});
