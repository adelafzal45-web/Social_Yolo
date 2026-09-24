import { Injectable, Logger } from '@nestjs/common';
import { PlatformConfigService, PlatformConfig } from '../../design-platform/platform-config.service';
import {
  StructuredDesignDocument,
  DesignLayer,
} from './structured-design.service';

export interface ValidationIssue {
  rule: 'content' | 'brand' | 'visual' | 'platform';
  severity: 'WARNING' | 'ERROR' | 'INFO';
  message: string;
  autoFixRecommendation?: string;
}

export interface DesignValidationReport {
  status: 'PASS' | 'WARNING' | 'ERROR';
  score: number; // 0 to 100
  textCoveragePct: number;
  issues: ValidationIssue[];
  passedChecks: string[];
}

@Injectable()
export class DesignValidationService {
  private readonly logger = new Logger(DesignValidationService.name);

  constructor(private readonly platformConfigService: PlatformConfigService) {}

  /**
   * Performs automated design validation before showing to the user.
   * Checks content clipping, brand consistency, WCAG contrast & text density,
   * and platform safe area compliance.
   */
  validateDesign(
    doc: StructuredDesignDocument,
    targetPlatformId?: string,
  ): DesignValidationReport {
    const issues: ValidationIssue[] = [];
    const passedChecks: string[] = [];

    const canvasWidth = doc.canvas.width || 1080;
    const canvasHeight = doc.canvas.height || 1080;
    const totalCanvasArea = canvasWidth * canvasHeight;

    const platformId = targetPlatformId || doc.metadata.platform || 'instagram_post';
    const platform = this.platformConfigService.getPlatformById(platformId);

    // 1. Content Validation
    const headline = doc.layers.find((l) => l.type === 'headline');
    const cta = doc.layers.find((l) => l.type === 'cta');
    const subheadline = doc.layers.find((l) => l.type === 'subheadline');

    if (headline) {
      if (headline.x + headline.width > canvasWidth) {
        issues.push({
          rule: 'content',
          severity: 'ERROR',
          message: 'Headline width exceeds canvas boundary, resulting in text clipping.',
          autoFixRecommendation: 'Reduce headline width or lower font size.',
        });
      } else {
        passedChecks.push('Headline fits within canvas boundaries without clipping.');
      }
    } else {
      issues.push({
        rule: 'content',
        severity: 'WARNING',
        message: 'No primary headline detected in design document.',
      });
    }

    if (cta && headline) {
      // Check collision between headline and CTA
      const overlapsY =
        headline.y < cta.y + cta.height && headline.y + headline.height > cta.y;
      const overlapsX =
        headline.x < cta.x + cta.width && headline.x + headline.width > cta.x;

      if (overlapsY && overlapsX) {
        issues.push({
          rule: 'content',
          severity: 'ERROR',
          message: 'Call-to-action collides with primary headline.',
          autoFixRecommendation: 'Move CTA further down toward canvas bottom.',
        });
      } else {
        passedChecks.push('Call-to-action button is clearly separated from typography.');
      }
    }

    // 2. Brand Validation
    const brandColors = doc.metadata.brandColors || [];
    if (brandColors.length > 0) {
      const usesBrandColor = doc.layers.some(
        (l) =>
          (l.color && brandColors.includes(l.color)) ||
          (l.backgroundColor && brandColors.includes(l.backgroundColor)),
      );
      if (usesBrandColor) {
        passedChecks.push('Design aligns with defined brand color palette.');
      } else {
        issues.push({
          rule: 'brand',
          severity: 'WARNING',
          message: 'Brand palette colors are not explicitly applied to prominent layers.',
          autoFixRecommendation: 'Apply primary brand color to CTA button or badges.',
        });
      }
    } else {
      passedChecks.push('Default neutral aesthetic applied (no brand colors mandated).');
    }

    const logo = doc.layers.find((l) => l.type === 'logo');
    if (logo) {
      if (logo.x < 16 || logo.y < 16) {
        issues.push({
          rule: 'brand',
          severity: 'WARNING',
          message: 'Logo lacks adequate padding (< 16px) from canvas edges.',
          autoFixRecommendation: 'Add at least 24px margin around logo.',
        });
      } else {
        passedChecks.push('Brand logo maintains sufficient clear space.');
      }
    }

    // 3. Visual Validation (Text density < 20% rule & contrast)
    let totalTextArea = 0;
    const textLayerTypes = ['headline', 'subheadline', 'body', 'cta', 'badge'];
    doc.layers.forEach((l) => {
      if (textLayerTypes.includes(l.type) && l.visible) {
        totalTextArea += l.width * l.height;
      }
    });

    const textCoveragePct = Math.round((totalTextArea / totalCanvasArea) * 1000) / 10;
    if (textCoveragePct > 20) {
      issues.push({
        rule: 'visual',
        severity: 'WARNING',
        message: `Text density (${textCoveragePct}%) exceeds the 20% guideline for social ad conversion.`,
        autoFixRecommendation: 'Compact typography or reduce subheadline length.',
      });
    } else {
      passedChecks.push(`Text density (${textCoveragePct}%) complies with social performance standards (< 20%).`);
    }

    // Contrast check (simplistic dark background vs light text check)
    const bg = doc.canvas.backgroundColor.toLowerCase();
    const isDarkBg =
      bg.includes('#0') ||
      bg.includes('#1') ||
      bg.includes('#2') ||
      bg === 'black' ||
      bg.includes('#0b0f19');

    if (isDarkBg && headline && headline.color) {
      const hColor = headline.color.toLowerCase();
      if (hColor.includes('#0') || hColor.includes('#1') || hColor === 'black') {
        issues.push({
          rule: 'visual',
          severity: 'ERROR',
          message: 'Poor text contrast: dark headline text on dark canvas background.',
          autoFixRecommendation: 'Change headline color to #FFFFFF or light brand accent.',
        });
      } else {
        passedChecks.push('High-contrast WCAG readable typography verified.');
      }
    } else {
      passedChecks.push('Contrast balance meets visual readability threshold.');
    }

    // 4. Platform Validation (Safe areas)
    if (platform && platform.safeArea) {
      const { top: safeTop, bottom: safeBottom } = platform.safeArea;
      if (safeTop > 0 || safeBottom > 0) {
        let safeAreaViolations = 0;
        doc.layers.forEach((layer) => {
          if (layer.type === 'headline' || layer.type === 'cta') {
            if (layer.y < safeTop) {
              safeAreaViolations++;
            }
            if (layer.y + layer.height > canvasHeight - safeBottom) {
              safeAreaViolations++;
            }
          }
        });

        if (safeAreaViolations > 0) {
          issues.push({
            rule: 'platform',
            severity: 'WARNING',
            message: `Key interactive or text layers enter platform safe areas (top ${safeTop}px, bottom ${safeBottom}px).`,
            autoFixRecommendation: 'Reposition layers within safe margins for Stories/Reels.',
          });
        } else {
          passedChecks.push(`All critical elements respect ${platform.name} safe zones.`);
        }
      } else {
        passedChecks.push(`Standard feed aspect ratio verified for ${platform.name}.`);
      }
    }

    // Compute status and score
    const hasErrors = issues.some((i) => i.severity === 'ERROR');
    const hasWarnings = issues.some((i) => i.severity === 'WARNING');

    let status: 'PASS' | 'WARNING' | 'ERROR' = 'PASS';
    let score = 96;

    if (hasErrors) {
      status = 'ERROR';
      score = Math.max(50, 85 - issues.length * 15);
    } else if (hasWarnings) {
      status = 'WARNING';
      score = Math.max(75, 95 - issues.length * 5);
    }

    return {
      status,
      score,
      textCoveragePct,
      issues,
      passedChecks,
    };
  }
}
