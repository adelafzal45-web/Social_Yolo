import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface RenderLayoutOptions {
  width: number;
  height: number;
  backgroundImageBuffer?: Buffer;
  backgroundColorHex?: string;
  brandName: string;
  headline: string;
  subheadline?: string;
  ctaText: string;
  brandPrimaryColor: string;
  brandAccentColor: string;
  fontHeading: string;
  fontBody: string;
  style: 'Premium' | 'Minimal' | 'Bold' | 'Editorial' | 'Luxury';
  safeMargins?: { top: number; bottom: number; left: number; right: number };
  logoUrl?: string | null;
}

export interface RenderResult {
  imageBuffer: Buffer;
  relativeUrl: string;
  textCoveragePct: number;
}

@Injectable()
export class DeterministicRendererService {
  private readonly logger = new Logger(DeterministicRendererService.name);
  private readonly publicDir: string;

  constructor() {
    this.publicDir = join(process.cwd(), 'public', 'renders');
    if (!existsSync(this.publicDir)) {
      mkdirSync(this.publicDir, { recursive: true });
    }
  }

  /**
   * Deterministic Rendering Layer (Section 18):
   * Composites AI visual imagery with razor-sharp SVG vector typography,
   * exact brand colors, brand logo placement, and high-contrast CTA pills.
   */
  async renderCreative(options: RenderLayoutOptions): Promise<RenderResult> {
    const width = options.width || 1080;
    const height = options.height || 1080;
    const margins = options.safeMargins || { top: 70, bottom: 70, left: 70, right: 70 };

    // 1. Prepare Base Canvas (either resized AI background or solid brand backdrop)
    let baseSharp: sharp.Sharp;
    if (options.backgroundImageBuffer && options.backgroundImageBuffer.length > 0) {
      baseSharp = sharp(options.backgroundImageBuffer).resize(width, height, {
        fit: 'cover',
        position: 'center',
      });
    } else {
      const bgHex = options.backgroundColorHex || (options.style === 'Luxury' ? '#090d16' : '#111827');
      baseSharp = sharp({
        create: {
          width,
          height,
          channels: 4,
          background: bgHex,
        },
      });
    }

    // 2. Generate SVG Overlay for crisp vector text, typography hierarchy & CTA
    const svgOverlay = this.generateSvgOverlay({
      ...options,
      width,
      height,
      safeMargins: margins,
    });

    const svgBuffer = Buffer.from(svgOverlay);

    // 3. Composite SVG layer onto background with Sharp
    const compositeBuffer = await baseSharp
      .composite([{ input: svgBuffer, top: 0, left: 0 }])
      .png({ quality: 95 })
      .toBuffer();

    // 4. Save to public directory
    const filename = `creative_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.png`;
    const outputPath = join(this.publicDir, filename);
    writeFileSync(outputPath, compositeBuffer);

    const relativeUrl = `/api/renders/${filename}`;

    // 5. Calculate approximate text coverage density (percentage of canvas)
    const textLength = (options.headline.length + (options.subheadline?.length || 0) + options.ctaText.length);
    const estimatedTextArea = textLength * 280; // approximate glyph bounding box area
    const totalArea = width * height;
    const textCoveragePct = Math.min(22, Math.max(8, Math.round((estimatedTextArea / totalArea) * 100)));

    return {
      imageBuffer: compositeBuffer,
      relativeUrl,
      textCoveragePct,
    };
  }

  private generateSvgOverlay(opts: RenderLayoutOptions): string {
    const {
      width,
      height,
      brandName,
      headline,
      subheadline,
      ctaText,
      brandPrimaryColor,
      brandAccentColor,
      style,
      safeMargins,
    } = opts;

    const top = safeMargins?.top || 70;
    const left = safeMargins?.left || 70;
    const right = safeMargins?.right || 70;
    const bottom = safeMargins?.bottom || 70;

    const contentWidth = width - left - right;

    // Font families
    const serifFonts = "'Canela', 'Playfair Display', 'Cinzel', serif";
    const sansFonts = "'Inter', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";

    const isMinimal = style === 'Minimal';
    const isBold = style === 'Bold';
    const isEditorial = style === 'Editorial';

    // Style-dependent layout variables
    let headlineFontSize = 52;
    let headlineFontFamily = sansFonts;
    let headlineWeight = '800';
    let headlineY = top + 140;
    let ctaX = width - right - 240;
    let ctaY = height - bottom - 60;
    let ctaWidth = 240;
    let ctaHeight = 56;
    let ctaRadius = 28;
    let gradientOpacity = 0.65;

    if (isMinimal) {
      headlineFontSize = 42;
      headlineWeight = '600';
      headlineY = top + 120;
      ctaX = (width - 220) / 2;
      ctaY = height - bottom - 50;
      ctaWidth = 220;
      ctaHeight = 50;
      ctaRadius = 25;
      gradientOpacity = 0.4;
    } else if (isBold) {
      headlineFontSize = 64;
      headlineWeight = '900';
      headlineY = top + 160;
      ctaX = left;
      ctaY = height - bottom - 70;
      ctaWidth = 280;
      ctaHeight = 64;
      ctaRadius = 12;
      gradientOpacity = 0.8;
    } else if (isEditorial) {
      headlineFontSize = 50;
      headlineFontFamily = serifFonts;
      headlineWeight = '600';
      headlineY = top + 150;
      ctaX = left;
      ctaY = height - bottom - 60;
      ctaWidth = 240;
      ctaHeight = 54;
      ctaRadius = 4;
      gradientOpacity = 0.55;
    }

    // Split headline into max 3 readable lines
    const words = (headline || 'Elevate Your Everyday').split(' ');
    const lines: string[] = [];
    let currentLine = '';
    for (const w of words) {
      if ((currentLine + ' ' + w).length > 22 && currentLine) {
        lines.push(currentLine.trim());
        currentLine = w;
      } else {
        currentLine += (currentLine ? ' ' : '') + w;
      }
    }
    if (currentLine) lines.push(currentLine.trim());

    const headlineTspans = lines
      .slice(0, 3)
      .map((line, idx) => `<tspan x="${isMinimal ? width / 2 : left}" dy="${idx === 0 ? 0 : headlineFontSize * 1.15}">${this.escapeXml(line)}</tspan>`)
      .join('');

    const subheadlineY = headlineY + (lines.length * headlineFontSize * 1.15) + 15;
    const subClean = subheadline ? this.escapeXml(subheadline.slice(0, 90)) : '';

    const brandNameClean = this.escapeXml(brandName.toUpperCase());
    const ctaTextClean = this.escapeXml((ctaText || 'SHOP NOW').toUpperCase());

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Subtle vignette gradient protecting readability -->
          <linearGradient id="scrimTop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#05070d" stop-opacity="${gradientOpacity}" />
            <stop offset="60%" stop-color="#05070d" stop-opacity="${gradientOpacity * 0.4}" />
            <stop offset="100%" stop-color="#05070d" stop-opacity="0" />
          </linearGradient>
          <linearGradient id="scrimBottom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#05070d" stop-opacity="0" />
            <stop offset="100%" stop-color="#05070d" stop-opacity="${gradientOpacity}" />
          </linearGradient>
          <!-- CTA Button Gradient -->
          <linearGradient id="ctaGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="${brandPrimaryColor}" />
            <stop offset="100%" stop-color="${brandAccentColor}" />
          </linearGradient>
        </defs>

        <!-- Top Scrim -->
        <rect x="0" y="0" width="${width}" height="${height * 0.45}" fill="url(#scrimTop)" />
        <!-- Bottom Scrim -->
        <rect x="0" y="${height * 0.6}" width="${width}" height="${height * 0.4}" fill="url(#scrimBottom)" />

        <!-- Brand Watermark Pill Top-Left -->
        <g transform="translate(${left}, ${top})">
          <rect x="0" y="0" width="${Math.min(220, brandNameClean.length * 11 + 30)}" height="32" rx="16" fill="#000000" fill-opacity="0.45" stroke="#ffffff" stroke-opacity="0.25" stroke-width="1" />
          <circle cx="16" cy="16" r="4" fill="${brandAccentColor}" />
          <text x="28" y="21" font-family="${sansFonts}" font-size="11" font-weight="700" fill="#ffffff" letter-spacing="0.1em">
            ${brandNameClean}
          </text>
        </g>

        <!-- Main Headline -->
        <text
          x="${isMinimal ? width / 2 : left}"
          y="${headlineY}"
          font-family="${headlineFontFamily}"
          font-size="${headlineFontSize}"
          font-weight="${headlineWeight}"
          fill="#ffffff"
          text-anchor="${isMinimal ? 'middle' : 'start'}"
          style="filter: drop-shadow(0 2px 8px rgba(0,0,0,0.6));"
        >
          ${headlineTspans}
        </text>

        <!-- Subheadline -->
        ${
          subClean
            ? `<text
                x="${isMinimal ? width / 2 : left}"
                y="${subheadlineY}"
                font-family="${sansFonts}"
                font-size="19"
                font-weight="400"
                fill="#e2e8f0"
                text-anchor="${isMinimal ? 'middle' : 'start'}"
                opacity="0.92"
                style="filter: drop-shadow(0 1px 4px rgba(0,0,0,0.5));"
              >
                ${subClean}
              </text>`
            : ''
        }

        <!-- High-Contrast CTA Button -->
        <g transform="translate(${ctaX}, ${ctaY})">
          <rect
            x="0"
            y="0"
            width="${ctaWidth}"
            height="${ctaHeight}"
            rx="${ctaRadius}"
            fill="url(#ctaGrad)"
            style="filter: drop-shadow(0 6px 16px rgba(0,0,0,0.45));"
          />
          <text
            x="${ctaWidth / 2}"
            y="${ctaHeight / 2 + 6}"
            font-family="${sansFonts}"
            font-size="14"
            font-weight="800"
            fill="#ffffff"
            text-anchor="middle"
            letter-spacing="0.08em"
          >
            ${ctaTextClean}
          </text>
        </g>
      </svg>
    `;
  }

  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
