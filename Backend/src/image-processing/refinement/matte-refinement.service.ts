import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import {
  BG_ANALYSIS_ENABLED,
  BG_REFINE_ENABLED,
  QA_CONFIG,
  REFINE_CONFIG,
} from '../../config/image-processing.config';
import { RefineResult, refineMatte } from './alpha-matte-refiner';
import { QualityReport, analyzeMatte } from './matte-quality';

export interface MatteProcessingResult {
  buffer: Buffer;
  qualityReport?: QualityReport;
  refinement: RefineResult;
}

/**
 * Service managing Sharp decode/encode lifecycle and orchestrating
 * in-memory alpha refinement and quality analysis.
 */
@Injectable()
export class MatteRefinementService {
  private readonly logger = new Logger(MatteRefinementService.name);

  private readonly analyzed = new WeakMap<
    Buffer,
    {
      data: Buffer;
      info: { width: number; height: number };
      report: QualityReport;
    }
  >();

  /**
   * Fast quality analysis pass on an existing image buffer without modifying pixel data.
   * Used on the cold fallback decision path to check if primary matte succeeded.
   */
  async analyzeOnly(pngBuffer: Buffer): Promise<QualityReport> {
    const t0 = Date.now();
    const { data, info } = await sharp(pngBuffer)
      .toColourspace('srgb')
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const rgba = new Uint8ClampedArray(
      data.buffer,
      data.byteOffset,
      data.length,
    );
    const report = analyzeMatte(rgba, info.width, info.height, QA_CONFIG);
    this.analyzed.set(pngBuffer, { data, info, report });

    this.logger.debug(
      `analyzeOnly completed in ${Date.now() - t0}ms: verdict=${report.verdict}, coverage=${(report.coverage * 100).toFixed(1)}%`,
    );

    return report;
  }

  /**
   * Main refinement pipeline:
   * 1. Decode PNG once to raw RGBA buffer (ensureAlpha)
   * 2. Analyze pre-refinement matte quality (if BG_ANALYSIS_ENABLED)
   * 3. Apply halo decontamination + smoothstep alpha curve (if BG_REFINE_ENABLED)
   * 4. Re-encode to optimized PNG once
   *
   * Master kill switch: if both BG_REFINE_ENABLED and BG_ANALYSIS_ENABLED are false,
   * returns the input buffer untouched with zero decode overhead (byte-identical parity).
   */
  async process(pngBuffer: Buffer): Promise<MatteProcessingResult> {
    if (!BG_REFINE_ENABLED && !BG_ANALYSIS_ENABLED) {
      this.logger.debug(
        'Refinement and analysis are both disabled via config kill switch.',
      );
      return {
        buffer: pngBuffer,
        refinement: { applied: false, stages: [] },
      };
    }

    const startTime = Date.now();

    // Consume the per-buffer analysis decode when fallback already inspected this matte.
    const cached = this.analyzed.get(pngBuffer);
    this.analyzed.delete(pngBuffer);
    const { data, info } =
      cached ??
      (await sharp(pngBuffer)
        .toColourspace('srgb')
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true }));

    const rgba = new Uint8ClampedArray(
      data.buffer,
      data.byteOffset,
      data.length,
    );
    const decodeTime = Date.now() - startTime;

    // 2. Structural quality inspection on the raw matte
    let qualityReport: QualityReport | undefined;
    if (BG_ANALYSIS_ENABLED) {
      const qaStart = Date.now();
      qualityReport =
        cached?.report ??
        analyzeMatte(rgba, info.width, info.height, QA_CONFIG);
      this.logger.debug(
        `Matte QA analyzed in ${Date.now() - qaStart}ms: verdict=${qualityReport.verdict} (opaque=${(qualityReport.opaqueFrac * 100).toFixed(1)}%, haze=${(qualityReport.hazeFrac * 100).toFixed(1)}%)`,
      );
    }

    // 3. In-memory pure algorithmic refinement (Decontaminate RGB -> Smoothstep alpha curve)
    let refinement: RefineResult = { applied: false, stages: [] };
    let finalBuffer = pngBuffer;

    if (qualityReport?.verdict === 'POSSIBLE_REMNANT') {
      this.logger.warn(qualityReport.details);
    }
    if (BG_REFINE_ENABLED) {
      const refineStart = Date.now();
      refinement = refineMatte(rgba, info.width, info.height, REFINE_CONFIG);
      const refineTime = Date.now() - refineStart;

      // 4. Single re-encode to high-compression PNG
      const encodeStart = Date.now();
      finalBuffer = await sharp(
        Buffer.from(rgba.buffer, rgba.byteOffset, rgba.byteLength),
        {
          raw: {
            width: info.width,
            height: info.height,
            channels: 4,
          },
        },
      )
        .png({ compressionLevel: 9, adaptiveFiltering: true, force: true })
        .toBuffer();
      const encodeTime = Date.now() - encodeStart;

      this.logger.log(
        `Matte refinement completed: decode=${decodeTime}ms, refine=${refineTime}ms (${refinement.stages.join(' -> ')}), encode=${encodeTime}ms. Total: ${Date.now() - startTime}ms`,
      );
    }

    return {
      buffer: finalBuffer,
      qualityReport,
      refinement,
    };
  }
}
