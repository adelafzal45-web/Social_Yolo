import { analyzeMatte, decideVerdict } from './matte-quality';

describe('MatteQuality (Pure Quality & Verdict Analysis)', () => {
  describe('analyzeMatte', () => {
    it('should compute accurate fractions for a 2x2 synthetic raster', () => {
      // 2x2 raster:
      // (0,0): Opaque solid [255, 255, 255, 255]
      // (1,0): Mid-alpha haze [200, 200, 200, 100]
      // (0,1): Transition [150, 150, 150, 20]
      // (1,1): Fully transparent [0, 0, 0, 0]
      const rgba = new Uint8ClampedArray([
        255, 255, 255, 255, 200, 200, 200, 100, 150, 150, 150, 20, 0, 0, 0, 0,
      ]);

      const report = analyzeMatte(rgba, 2, 2);

      // Total pixels = 4, subject = 3 (alpha > 0), transparent = 1 (alpha == 0)
      expect(report.coverage).toBe(0.75);
      expect(report.transparentFrac).toBe(0.25);
      expect(report.opaqueFrac).toBe(0.25); // 1 pixel with alpha >= 250
      expect(report.minAlpha).toBe(0);
      expect(report.maxAlpha).toBe(255);

      // Transition pixels with 0 < a < 250 are 2 out of 3 subject pixels
      expect(report.transitionBandFrac).toBeCloseTo(2 / 3, 2);

      // Haze pixel (32 <= a <= 220): 1 pixel (alpha 100) out of 3 subject pixels
      expect(report.hazeFrac).toBeCloseTo(1 / 3, 2);
    });

    it('should correctly evaluate border opaque fraction on 3x3 image', () => {
      // 3x3 image, 8 border pixels, 1 center pixel
      // Top row (3 border pixels) has alpha 255
      // All other pixels have alpha 0
      const rgba = new Uint8ClampedArray(3 * 3 * 4);
      rgba[3] = 255; // (0, 0)
      rgba[7] = 255; // (1, 0)
      rgba[11] = 255; // (2, 0)

      const report = analyzeMatte(rgba, 3, 3);
      // 3 border pixels out of 8 total border pixels = 37.5%
      expect(report.borderOpaqueFrac).toBe(3 / 8);
    });
  });

  describe('decideVerdict', () => {
    it('should return EMPTY_SUBJECT when coverage is below threshold', () => {
      const { verdict } = decideVerdict({
        coverage: 0.001, // below 0.005
        opaqueFrac: 0.001,
        transparentFrac: 0.999,
        transitionBandFrac: 0,
        hazeFrac: 0,
        borderOpaqueFrac: 0,
        minAlpha: 0,
        maxAlpha: 255,
      });
      expect(verdict).toBe('EMPTY_SUBJECT');
    });

    it('should return EMPTY_SUBJECT when maxAlpha is below 32', () => {
      const { verdict } = decideVerdict({
        coverage: 0.5,
        opaqueFrac: 0,
        transparentFrac: 0.5,
        transitionBandFrac: 1,
        hazeFrac: 0,
        borderOpaqueFrac: 0,
        minAlpha: 0,
        maxAlpha: 20, // maxAlpha < 32
      });
      expect(verdict).toBe('EMPTY_SUBJECT');
    });

    it('should return NO_REMOVAL when transparent fraction is near zero', () => {
      const { verdict } = decideVerdict({
        coverage: 0.999,
        opaqueFrac: 0.95,
        transparentFrac: 0.001, // < 0.01
        transitionBandFrac: 0.05,
        hazeFrac: 0.01,
        borderOpaqueFrac: 0.2,
        minAlpha: 10,
        maxAlpha: 255,
      });
      expect(verdict).toBe('NO_REMOVAL');
    });

    it('should return NO_REMOVAL when minAlpha is above 250', () => {
      const { verdict } = decideVerdict({
        coverage: 1.0,
        opaqueFrac: 1.0,
        transparentFrac: 0,
        transitionBandFrac: 0,
        hazeFrac: 0,
        borderOpaqueFrac: 0.1,
        minAlpha: 252, // > 250
        maxAlpha: 255,
      });
      expect(verdict).toBe('NO_REMOVAL');
    });

    it('should return LOW_CONFIDENCE when opaque pixels heavily touch the border', () => {
      const { verdict } = decideVerdict({
        coverage: 0.6,
        opaqueFrac: 0.5,
        transparentFrac: 0.4,
        transitionBandFrac: 0.1,
        hazeFrac: 0.05,
        borderOpaqueFrac: 0.55, // > 0.40
        minAlpha: 0,
        maxAlpha: 255,
      });
      expect(verdict).toBe('LOW_CONFIDENCE');
    });

    it('should return POSSIBLE_REMNANT when haze fraction exceeds threshold', () => {
      const { verdict } = decideVerdict({
        coverage: 0.5,
        opaqueFrac: 0.3,
        transparentFrac: 0.5,
        transitionBandFrac: 0.4,
        hazeFrac: 0.25, // > 0.15
        borderOpaqueFrac: 0.05,
        minAlpha: 0,
        maxAlpha: 255,
      });
      expect(verdict).toBe('POSSIBLE_REMNANT');
    });

    it('should return OK for a clean, well-isolated matte', () => {
      const { verdict } = decideVerdict({
        coverage: 0.45,
        opaqueFrac: 0.4,
        transparentFrac: 0.55,
        transitionBandFrac: 0.1,
        hazeFrac: 0.03,
        borderOpaqueFrac: 0.02,
        minAlpha: 0,
        maxAlpha: 255,
      });
      expect(verdict).toBe('OK');
    });
  });
});
