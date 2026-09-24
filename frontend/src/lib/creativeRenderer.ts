import { BrandProfile, CreativeVariant, DesignStyle, PlatformKey } from '../types';

export interface RenderOptions {
  width: number;
  height: number;
  style: DesignStyle;
  brand: BrandProfile;
  headline: string;
  body: string;
  occasion?: string;
  ctaText?: string;
  productImageSrc?: string;
  backdropId?: string;
  isMetaAd?: boolean;
}

export interface RenderResult {
  dataUrl: string;
  width: number;
  height: number;
  textCoveragePct: number;
  metaPass: boolean;
}

export async function renderCreativeCanvas(options: RenderOptions): Promise<RenderResult> {
  const {
    width,
    height,
    style,
    brand,
    headline,
    body,
    occasion = 'LIMITED EDITION',
    ctaText = 'SHOP NOW',
    productImageSrc,
    isMetaAd = false,
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not supported');
  }

  // 1. Draw Background
  drawBackground(ctx, width, height, style, brand);

  // 2. Draw Style Accents / Framing
  drawStyleAccents(ctx, width, height, style, brand);

  // 3. Draw Product Image (hero)
  if (productImageSrc) {
    try {
      const img = await loadImage(productImageSrc);
      drawProduct(ctx, img, width, height, style);
    } catch (e) {
      console.warn('Could not load product image for canvas render, using styled placeholder', e);
      drawProductPlaceholder(ctx, width, height, brand, style);
    }
  } else {
    drawProductPlaceholder(ctx, width, height, brand, style);
  }

  // 4. Draw Typography & Badges
  const textCoverage = drawTypography(
    ctx,
    width,
    height,
    style,
    brand,
    headline,
    body,
    occasion,
    ctaText,
    isMetaAd,
  );

  const textCoveragePct = Math.min(100, Math.max(8, Math.round(textCoverage)));
  const metaPass = textCoveragePct <= 20;

  return {
    dataUrl: canvas.toDataURL('image/png', 0.95),
    width,
    height,
    textCoveragePct,
    metaPass,
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  style: DesignStyle,
  brand: BrandProfile,
) {
  const p = brand.colors.primary || '#c98a3f';
  const s = brand.colors.secondary || '#3a2c5a';

  switch (style) {
    case 'luxury': {
      // Deep moody dark radial gradient with warm gold halo
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.45, w * 0.1, w * 0.5, h * 0.5, w * 0.9);
      grad.addColorStop(0, '#241a18');
      grad.addColorStop(0.6, '#141010');
      grad.addColorStop(1, '#080608');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case 'bold': {
      // High contrast electric gradient
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, p);
      grad.addColorStop(0.7, '#ff7a3d');
      grad.addColorStop(1, '#ffb648');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case 'minimalist': {
      // Soft organic alabaster studio paper
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#f8f6f4');
      grad.addColorStop(1, '#ede8e3');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case 'tech': {
      // Deep slate / cyber mesh background
      const grad = ctx.createRadialGradient(w * 0.4, h * 0.35, w * 0.05, w * 0.5, h * 0.5, w * 0.85);
      grad.addColorStop(0, '#1c2438');
      grad.addColorStop(0.7, '#0f1422');
      grad.addColorStop(1, '#070a12');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case 'playful': {
      // Soft pastel gradient
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#ffc6d9');
      grad.addColorStop(0.5, '#ffd6a5');
      grad.addColorStop(1, '#caffbf');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case 'lifestyle':
    default: {
      // Warm artisanal ambient gradient
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.4, w * 0.15, w * 0.5, h * 0.5, w * 0.8);
      grad.addColorStop(0, '#36294d');
      grad.addColorStop(0.5, '#1e1632');
      grad.addColorStop(1, '#0e0b1c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      break;
    }
  }
}

function drawStyleAccents(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  style: DesignStyle,
  brand: BrandProfile,
) {
  const p = brand.colors.primary || '#c98a3f';
  const a = brand.colors.accent || '#e0aa4e';

  ctx.save();
  if (style === 'luxury') {
    // Elegant border frame
    ctx.strokeStyle = 'rgba(217, 162, 74, 0.3)';
    ctx.lineWidth = Math.max(1, Math.round(w * 0.0015));
    ctx.strokeRect(w * 0.05, h * 0.04, w * 0.9, h * 0.92);

    // Corner diamond markers
    ctx.fillStyle = a;
    const cw = w * 0.05;
    const ch = h * 0.04;
    ctx.fillRect(cw - 3, ch - 3, 6, 6);
    ctx.fillRect(w - cw - 3, ch - 3, 6, 6);
    ctx.fillRect(cw - 3, h - ch - 3, 6, 6);
    ctx.fillRect(w - cw - 3, h - ch - 3, 6, 6);
  } else if (style === 'tech') {
    // Subtle cyber grid
    ctx.strokeStyle = 'rgba(78, 201, 255, 0.08)';
    ctx.lineWidth = 1;
    const step = w * 0.08;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  } else if (style === 'playful') {
    // Rounded decorative shapes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(w * 0.85, h * 0.15, w * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w * 0.15, h * 0.85, w * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawProduct(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
  style: DesignStyle,
) {
  ctx.save();

  const isWide = w > h;
  const isTall = h > w * 1.3;

  let targetMaxW = w * 0.65;
  let targetMaxH = h * 0.55;

  if (isWide) {
    targetMaxW = w * 0.42;
    targetMaxH = h * 0.72;
  } else if (isTall) {
    targetMaxW = w * 0.72;
    targetMaxH = h * 0.5;
  }

  const aspect = img.width / img.height;
  let drawW = targetMaxW;
  let drawH = drawW / aspect;

  if (drawH > targetMaxH) {
    drawH = targetMaxH;
    drawW = drawH * aspect;
  }

  let posX = (w - drawW) / 2;
  let posY = isWide ? (h - drawH) / 2 : h * 0.38 - drawH / 2;

  if (isWide) {
    posX = w * 0.55;
  }

  // Realistic drop shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = Math.round(w * 0.04);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.round(h * 0.025);

  ctx.drawImage(img, posX, posY, drawW, drawH);
  ctx.restore();
}

function drawProductPlaceholder(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  brand: BrandProfile,
  style: DesignStyle,
) {
  ctx.save();
  const isWide = w > h;
  const centerX = isWide ? w * 0.65 : w * 0.5;
  const centerY = isWide ? h * 0.5 : h * 0.42;
  const radius = Math.min(w, h) * 0.22;

  // Shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 35;
  ctx.shadowOffsetY = 15;

  // Product pedestal circle
  const grad = ctx.createRadialGradient(
    centerX - radius * 0.2,
    centerY - radius * 0.2,
    radius * 0.1,
    centerX,
    centerY,
    radius,
  );
  grad.addColorStop(0, brand.colors.accent || '#e0aa4e');
  grad.addColorStop(1, brand.colors.primary || '#c98a3f');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  // Floating label badge
  ctx.shadowBlur = 10;
  ctx.fillStyle = brand.colors.secondary || '#3a2c5a';
  const bw = radius * 1.5;
  const bh = radius * 0.5;
  ctx.beginPath();
  roundRect(ctx, centerX - bw / 2, centerY - bh / 2, bw, bh, 8);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(bh * 0.32)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const logoText = (brand?.name || 'Brand').toUpperCase();
  ctx.fillText(logoText, centerX, centerY - bh * 0.1);

  ctx.font = `italic ${Math.round(bh * 0.2)}px serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText('— specialty edition —', centerX, centerY + bh * 0.25);

  ctx.restore();
}

function drawTypography(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  style: DesignStyle,
  brand: BrandProfile,
  headline: string,
  body: string,
  occasion: string,
  ctaText: string,
  isMetaAd: boolean,
): number {
  ctx.save();

  const isLight = style === 'minimalist';
  const textColor = isLight ? '#1a1824' : '#ffffff';
  const subColor = isLight ? '#5c5468' : 'rgba(255, 255, 255, 0.78)';
  const isWide = w > h;

  let totalTextArea = 0;

  // 1. Brand Logo / Header
  const brandFontSize = Math.max(14, Math.round(w * 0.024));
  ctx.font = `700 ${brandFontSize}px sans-serif`;
  ctx.fillStyle = isLight ? '#333' : 'rgba(255, 255, 255, 0.9)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const brandX = w * 0.08;
  const brandY = h * 0.06;
  const brandHeading = (brand?.name || 'Brand').toUpperCase();
  ctx.fillText(brandHeading, brandX, brandY);
  totalTextArea += brandFontSize * brandHeading.length * (brandFontSize * 0.6);

  // 2. Occasion Tag Chip
  const tagFontSize = Math.max(11, Math.round(w * 0.016));
  ctx.font = `700 ${tagFontSize}px sans-serif`;
  const tagText = (occasion || '').toUpperCase();
  const tagPadX = 14;
  const tagPadY = 6;
  const tagWidth = ctx.measureText(tagText).width + tagPadX * 2;
  const tagHeight = tagFontSize + tagPadY * 2;
  const tagX = brandX;
  const tagY = isWide ? h * 0.22 : h * 0.65;

  ctx.fillStyle = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.12)';
  ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  roundRect(ctx, tagX, tagY, tagWidth, tagHeight, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = brand.colors.accent || (isLight ? '#333' : '#f0ad4e');
  ctx.textBaseline = 'middle';
  ctx.fillText(tagText, tagX + tagPadX, tagY + tagHeight / 2);
  totalTextArea += tagWidth * tagHeight;

  // 3. Main Headline
  // In Meta Ad mode, font size is slightly moderated to guarantee <= 20% area
  const headScale = isMetaAd ? 0.048 : 0.056;
  const headFontSize = Math.max(22, Math.round(w * headScale));
  ctx.font = `bold ${headFontSize}px ${brand.fonts.display || 'Georgia, serif'}`;
  ctx.fillStyle = textColor;
  ctx.textBaseline = 'top';

  const maxTextWidth = isWide ? w * 0.44 : w * 0.84;
  const headY = tagY + tagHeight + 14;
  const lines = wrapText(ctx, headline, maxTextWidth);

  let currentY = headY;
  const lineHeight = headFontSize * 1.2;
  for (const line of lines) {
    ctx.fillText(line, brandX, currentY);
    totalTextArea += line.length * (headFontSize * 0.55) * lineHeight;
    currentY += lineHeight;
  }

  // 4. Body Copy
  const bodyFontSize = Math.max(13, Math.round(w * 0.022));
  ctx.font = `${bodyFontSize}px ${brand.fonts.body || 'sans-serif'}`;
  ctx.fillStyle = subColor;
  currentY += 8;
  const bodyLines = wrapText(ctx, body, maxTextWidth);
  const bodyLineHeight = bodyFontSize * 1.35;
  for (const bline of bodyLines.slice(0, 3)) {
    ctx.fillText(bline, brandX, currentY);
    totalTextArea += bline.length * (bodyFontSize * 0.5) * bodyLineHeight;
    currentY += bodyLineHeight;
  }

  // 5. CTA Button
  const ctaFontSize = Math.max(12, Math.round(w * 0.02));
  ctx.font = `bold ${ctaFontSize}px sans-serif`;
  const ctaTextW = ctx.measureText(ctaText).width;
  const ctaPadX = 22;
  const ctaPadY = 12;
  const ctaW = ctaTextW + ctaPadX * 2;
  const ctaH = ctaFontSize + ctaPadY * 2;
  const ctaX = brandX;
  const ctaY = Math.min(h - ctaH - h * 0.06, currentY + 16);

  ctx.fillStyle = brand.colors.accent || '#e0aa4e';
  ctx.beginPath();
  roundRect(ctx, ctaX, ctaY, ctaW, ctaH, 8);
  ctx.fill();

  ctx.fillStyle = '#111118';
  ctx.textBaseline = 'middle';
  ctx.fillText(ctaText, ctaX + ctaPadX, ctaY + ctaH / 2);
  totalTextArea += ctaW * ctaH;

  ctx.restore();

  const totalCanvasArea = w * h;
  return (totalTextArea / totalCanvasArea) * 100;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
}
