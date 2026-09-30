import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleGenAI } from '@google/genai';
import { BrandProfile } from './entities/brand-profile.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { RedisCacheService } from '../common/cache/redis-cache.service';

/** Where a logo candidate was discovered on the page. Drives the UI provenance label. */
export type LogoSource =
  | 'json-ld'
  | 'og-logo'
  | 'og-image'
  | 'apple-touch-icon'
  | 'img-tag'
  | 'link-icon'
  | 'common-path'
  | 'favicon';

export interface ExtractedBrandData {
  url: string;
  brandName: string;
  niche: string;
  tagline: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  brandColors: string[];
  fontHeading: string;
  fontBody: string;
  tone: string;
  /** Absolute URL of the best logo found on the site (may be an SVG/ICO). */
  logoUrl: string | null;
  /** Which markup the logo came from, for the "found via …" label in the UI. */
  logoSource: LogoSource | null;
  /**
   * True only when a Gemini-compatible raster logo (png/jpeg/webp) was actually
   * downloaded and verified. When false the UI must ask the user to upload a
   * logo file instead — an SVG or ICO cannot be composited by the image model.
   */
  logoReady: boolean;
  /**
   * `data:<mime>;base64,…` for the verified raster logo. This is what turns the
   * scraped logo into a real uploadable File in the browser — without it the
   * extracted logo is only a preview and never reaches the generator.
   */
  logoDataUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactWebsite: string | null;
}

/** A logo URL candidate plus where it came from and how strongly we trust it. */
interface LogoCandidate {
  url: string;
  source: LogoSource;
  rank: number;
}

/**
 * How many ranked logo candidates we are willing to download. The top sources
 * (JSON-LD, og:logo, apple-touch-icon, <img>, og:image, icon link) sit inside
 * this cap; the conventional-path guesses are only a fallback for sites that
 * declare nothing at all. Keeping the cap tight bounds both latency and the
 * number of outbound requests a single user click can trigger.
 */
const MAX_LOGO_PROBES = 8;

@Injectable()
export class BrandsService {
  private readonly logger = new Logger(BrandsService.name);
  private readonly geminiClient: GoogleGenAI | null;

  constructor(
    @InjectRepository(BrandProfile)
    private readonly brandRepo: Repository<BrandProfile>,
    private readonly cache: RedisCacheService,
  ) {
    const apiKey = process.env.GEMINI_API_KEY;
    this.geminiClient = apiKey ? new GoogleGenAI({ apiKey }) : null;
  }

  async listUserBrands(userId: string): Promise<BrandProfile[]> {
    const cacheKey = `brands:user:${userId}`;
    const cached = await this.cache.get<BrandProfile[]>(cacheKey);
    if (cached) return cached;

    const brands = await this.brandRepo.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
    await this.cache.set(cacheKey, brands, 60);
    return brands;
  }

  async getBrandById(userId: string, id: string): Promise<BrandProfile> {
    const cacheKey = `brands:id:${id}`;
    const cached = await this.cache.get<BrandProfile>(cacheKey);
    if (cached) return cached;

    const brand = await this.brandRepo.findOne({
      where: { id, userId },
    });
    if (!brand) {
      throw new NotFoundException(`Brand profile with ID ${id} not found.`);
    }
    await this.cache.set(cacheKey, brand, 60);
    return brand;
  }

  async createBrand(
    userId: string,
    dto: CreateBrandDto,
  ): Promise<BrandProfile> {
    if (dto.isDefault) {
      await this.brandRepo.update({ userId }, { isDefault: false });
    }

    const brand = this.brandRepo.create({
      ...dto,
      userId,
    });
    const saved = await this.brandRepo.save(brand);
    await this.cache.delPattern(`brands:*`);
    return saved;
  }

  async updateBrand(
    userId: string,
    id: string,
    dto: UpdateBrandDto,
  ): Promise<BrandProfile> {
    const brand = await this.getBrandById(userId, id);

    if (dto.isDefault) {
      await this.brandRepo.update({ userId }, { isDefault: false });
    }

    Object.assign(brand, dto);
    const saved = await this.brandRepo.save(brand);
    await this.cache.delPattern(`brands:*`);
    return saved;
  }

  async deleteBrand(userId: string, id: string): Promise<{ success: boolean }> {
    const brand = await this.getBrandById(userId, id);
    await this.brandRepo.remove(brand);
    await this.cache.delPattern(`brands:*`);
    return { success: true };
  }

  /**
   * Scrapes website metadata and analyzes it with Gemini to extract brand identity.
   */
  async extractBrandFromUrl(inputUrl: string): Promise<ExtractedBrandData> {
    if (!inputUrl || !inputUrl.trim()) {
      throw new NotFoundException('Please provide a valid website URL.');
    }

    let targetUrl = inputUrl.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      throw new NotFoundException(`Invalid URL format: "${inputUrl}"`);
    }

    // Default clean brand name from domain
    const hostParts = parsedUrl.hostname.replace(/^www\./i, '').split('.');
    const fallbackBrandName = hostParts[0]
      ? hostParts[0].charAt(0).toUpperCase() + hostParts[0].slice(1)
      : 'My Company';

    let html = '';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        html = await response.text();
      }
    } catch (err: any) {
      this.logger.warn(
        `Failed to fetch HTML from ${targetUrl}: ${err.message}. Using domain heuristics.`,
      );
    }

    // Extract HTML tags & OpenGraph metadata
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    const metaDescMatch =
      html.match(
        /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i,
      );
    const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : '';

    const ogTitleMatch =
      html.match(
        /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i,
      );
    const ogTitle = ogTitleMatch ? ogTitleMatch[1].trim() : '';

    const ogDescMatch =
      html.match(
        /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i,
      );
    const ogDescription = ogDescMatch ? ogDescMatch[1].trim() : '';

    const ogSiteNameMatch =
      html.match(
        /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i,
      );
    const ogSiteName = ogSiteNameMatch ? ogSiteNameMatch[1].trim() : '';

    // ── Logo discovery ────────────────────────────────────────────────────
    // A favicon alone is almost never a usable brand mark (16-32px, often just a
    // glyph), so we walk a ranked list of real sources and verify each candidate
    // is a downloadable image before trusting it.
    const logoCandidates = this.collectLogoCandidates(html, targetUrl, parsedUrl);
    const resolvedLogo = await this.resolveLogo(logoCandidates, targetUrl);

    // Extract hex colors from stylesheets/inline CSS
    const colorMatches = html.match(/#([a-fA-F0-9]{6})\b/g) || [];
    const colorFrequency: Record<string, number> = {};
    for (const c of colorMatches) {
      const lower = c.toLowerCase();
      // Ignore common background whites/blacks/greys for brand identity
      if (
        lower === '#ffffff' ||
        lower === '#000000' ||
        lower === '#111111' ||
        lower === '#f8f9fa' ||
        lower === '#212529'
      ) {
        continue;
      }
      colorFrequency[lower] = (colorFrequency[lower] || 0) + 1;
    }
    const detectedColors = Object.entries(colorFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([col]) => col);

    // Extract clean body text snippet
    const cleanText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000);

    // ── Contact details (email / phone / site) ───────────────────────────
    // Pulled from mailto:/tel: links and visible text so the user can confirm
    // (or correct) them before they get typeset onto the creative.
    const contact = this.extractContactDetails(html, cleanText, targetUrl);

    // 1. Try Gemini AI Extraction
    if (this.geminiClient) {
      try {
        const textModel = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';
        const prompt = `You are an elite Brand Strategist and Commercial Art Director.
Analyze this website's metadata and page text to determine its corporate brand identity for social media marketing.

Website URL: ${targetUrl}
Page Title: ${title || ogTitle || fallbackBrandName}
Site Name: ${ogSiteName || fallbackBrandName}
Meta Description: ${metaDescription || ogDescription}
Detected Colors: ${detectedColors.join(', ') || 'none detected'}
Homepage Text: ${cleanText.slice(0, 1500)}

Return ONLY a JSON object with this exact schema:
{
  "brandName": "Exact Brand / Company Name",
  "niche": "Primary Industry / Commercial Category (e.g. Luxury Fashion, Tech & SaaS, Specialty Coffee, Fitness & Apparel)",
  "tagline": "Short memorable marketing slogan or mission",
  "description": "1-2 sentence compelling summary of the company and products",
  "primaryColor": "#hex code (vibrant dominant brand color)",
  "secondaryColor": "#hex code (complementary tone)",
  "accentColor": "#hex code (highlight color)",
  "fontHeading": "Heading font style (e.g. Playfair Display, Montserrat, Plus Jakarta Sans, Cinzel, Inter)",
  "fontBody": "Body font style (e.g. Inter, Lato, Roboto)",
  "tone": "Brand voice (choose closest from: 'Luxury & Elegant', 'Modern & Minimalist', 'Bold & High-Impact', 'Authentic Lifestyle', 'Futuristic Tech', 'Playful & Vibrant')"
}`;

        const geminiRes = await this.geminiClient.models.generateContent({
          model: textModel,
          contents: [{ text: prompt }],
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawJson = geminiRes.text || '{}';
        const parsed = JSON.parse(rawJson);

        return {
          url: targetUrl,
          brandName: parsed.brandName || ogSiteName || fallbackBrandName,
          niche: parsed.niche || 'E-Commerce & Retail',
          tagline: parsed.tagline || metaDescription.slice(0, 100) || '',
          description:
            parsed.description ||
            metaDescription ||
            `${fallbackBrandName} commercial brand`,
          primaryColor: parsed.primaryColor || detectedColors[0] || '#7c5cff',
          secondaryColor:
            parsed.secondaryColor || detectedColors[1] || '#e0aa4e',
          accentColor: parsed.accentColor || detectedColors[2] || '#ffffff',
          brandColors: [
            parsed.primaryColor || detectedColors[0] || '#7c5cff',
            parsed.secondaryColor || detectedColors[1] || '#e0aa4e',
            parsed.accentColor || detectedColors[2] || '#ffffff',
          ],
          fontHeading: parsed.fontHeading || 'Playfair Display',
          fontBody: parsed.fontBody || 'Inter',
          tone: parsed.tone || 'Luxury & Elegant',
          logoUrl: resolvedLogo.logoUrl,
          logoSource: resolvedLogo.logoSource,
          logoReady: resolvedLogo.logoReady,
          logoDataUrl: resolvedLogo.logoDataUrl,
          contactEmail: contact.email,
          contactPhone: contact.phone,
          contactWebsite: targetUrl,
        };
      } catch (geminiErr: any) {
        this.logger.warn(
          `Gemini brand analysis failed: ${geminiErr.message}. Using heuristic fallback.`,
        );
      }
    }

    // 2. High quality fallback if Gemini offline
    const finalBrandName =
      ogSiteName || title.split(/[-|–:]/)[0].trim() || fallbackBrandName;
    const finalDesc =
      metaDescription ||
      ogDescription ||
      `Official commercial social campaign for ${finalBrandName}.`;

    return {
      url: targetUrl,
      brandName: finalBrandName,
      niche: 'Commercial Business & Brand',
      tagline: title ? title.slice(0, 80) : '',
      description: finalDesc,
      primaryColor: detectedColors[0] || '#7c5cff',
      secondaryColor: detectedColors[1] || '#e0aa4e',
      accentColor: detectedColors[2] || '#ffffff',
      brandColors:
        detectedColors.length >= 3
          ? detectedColors.slice(0, 3)
          : ['#7c5cff', '#e0aa4e', '#ffffff'],
      fontHeading: 'Playfair Display',
      fontBody: 'Inter',
      tone: 'Luxury & Elegant',
      logoUrl: resolvedLogo.logoUrl,
      logoSource: resolvedLogo.logoSource,
      logoReady: resolvedLogo.logoReady,
      logoDataUrl: resolvedLogo.logoDataUrl,
      contactEmail: contact.email,
      contactPhone: contact.phone,
      contactWebsite: targetUrl,
    };
  }
/**
   * ══════════════════════════════════════════════════════════════════════════
   *  LOGO DISCOVERY
   * ══════════════════════════════════════════════════════════════════════════
   *
   * Walks every place a site realistically declares its brand mark, in
   * descending order of trust:
   *
   *   0  JSON-LD `Organization.logo`      — machine-readable, highest trust
   *   1  `og:logo`                        — explicit OpenGraph logo tag
   *   2  `apple-touch-icon`               — designed at 180px, usually crisp
   *   3  `<img>` whose src/class/alt mentions "logo"
   *   4  `og:image`                       — usually a photo, so ranked lower
   *   5  `<link rel="icon">` / `mask-icon`
   *   6  conventional paths (/logo.svg, /assets/logo.png, …)
   *   7  `/favicon.ico`                   — last resort
   *
   * Duplicates are collapsed and the list is sorted by rank so `resolveLogo`
   * can simply try them in order.
   */
  private collectLogoCandidates(
    html: string,
    baseUrl: string,
    parsedUrl: URL,
  ): LogoCandidate[] {
    const candidates: LogoCandidate[] = [];
    const seen = new Set<string>();

    const push = (raw: string | null | undefined, source: LogoSource, rank: number) => {
      if (!raw || typeof raw !== 'string') return;
      const trimmed = raw.trim();
      if (!trimmed || trimmed.startsWith('data:')) return;
      let absolute: string;
      try {
        absolute = new URL(trimmed, baseUrl).href;
      } catch {
        return;
      }
      if (seen.has(absolute)) return;
      seen.add(absolute);
      candidates.push({ url: absolute, source, rank });
    };

    // 0. JSON-LD Organization.logo (may be a string or an ImageObject).
    const ldBlocks = html.match(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    );
    for (const block of ldBlocks || []) {
      const json = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
      try {
        const parsed = JSON.parse(json.trim());
        const nodes = Array.isArray(parsed)
          ? parsed
          : parsed && Array.isArray(parsed['@graph'])
            ? parsed['@graph']
            : [parsed];
        for (const node of nodes) {
          if (!node || typeof node !== 'object') continue;
          const logo = (node as any).logo;
          if (typeof logo === 'string') push(logo, 'json-ld', 0);
          else if (logo && typeof logo === 'object' && typeof logo.url === 'string') {
            push(logo.url, 'json-ld', 0);
          }
        }
      } catch {
        // Malformed JSON-LD is extremely common — ignore and keep scanning.
      }
    }

    // 1. og:logo / og:image:url
    const ogLogo =
      this.matchMetaContent(html, 'og:logo') ||
      this.matchMetaContent(html, 'og:image:url');
    push(ogLogo, 'og-logo', 1);

    // 2. apple-touch-icon — sized for high-DPI, the best raster source.
    push(
      this.matchLinkHref(html, ['apple-touch-icon-precomposed', 'apple-touch-icon']),
      'apple-touch-icon',
      2,
    );

    // 3. <img> tags that advertise themselves as the logo.
    //    Capped: a busy homepage can have a dozen "logo"-classed images (partner
    //    strip, footer badges) and letting them flood the ranked list would push
    //    the far more reliable og:image candidate out of the probe window.
    const imgTags = html.match(/<img\b[^>]*>/gi) || [];
    let imgLogoCount = 0;
    for (const tag of imgTags) {
      if (imgLogoCount >= 3) break;
      const haystack = tag.toLowerCase();
      if (!/logo|wordmark|brandmark/.test(haystack)) continue;
      // Skip tiny icons that merely sit near the word "logo" in the markup.
      if (/\bicon\b|favicon|sprite|placeholder|spinner/.test(haystack)) continue;
      const src =
        tag.match(/\bsrc=["']([^"']+)["']/i)?.[1] ||
        tag.match(/\bdata-src=["']([^"']+)["']/i)?.[1] ||
        tag.match(/\bsrcset=["']([^"']+)["']/i)?.[1]?.split(',')[0]?.trim().split(/\s+/)[0];
      const before = candidates.length;
      push(src, 'img-tag', 3);
      if (candidates.length > before) imgLogoCount += 1;
    }

    // 4. og:image — frequently a product photo rather than a logo.
    push(this.matchMetaContent(html, 'og:image'), 'og-image', 4);

    // 5. Generic icon links (mask-icon is often a monochrome SVG logo mark).
    push(this.matchLinkHref(html, ['mask-icon']), 'link-icon', 5);
    push(this.matchLinkHref(html, ['icon', 'shortcut icon']), 'link-icon', 6);

    // 6. Conventional paths, for sites that reference the logo only in CSS.
    const conventional = [
      '/logo.svg',
      '/logo.png',
      '/assets/logo.svg',
      '/assets/logo.png',
      '/images/logo.svg',
      '/images/logo.png',
      '/img/logo.png',
      '/static/logo.png',
      '/brand/logo.png',
      '/wp-content/uploads/logo.png',
    ];
    conventional.forEach((path, index) => {
      try {
        push(new URL(path, parsedUrl.origin).href, 'common-path', 7 + index * 0.01);
      } catch {
        /* ignore malformed origin */
      }
    });

    // 7. Absolute last resort.
    try {
      push(new URL('/favicon.ico', parsedUrl.origin).href, 'favicon', 99);
    } catch {
      /* ignore */
    }

    return candidates.sort((a, b) => a.rank - b.rank);
  }

/**
   * Tries each candidate in priority order and returns the first one that both
   * downloads AND is a format the image model can composite.
   *
   * SVG and ICO are deliberately treated as *not ready*: a browser can preview
   * them but Gemini cannot composite them, and an ICO is usually a 32px glyph.
   * In that case we still hand back the URL (so the UI can show what was found)
   * but set `logoReady: false` — the signal for the frontend to ask the user to
   * upload their own logo file instead.
   */
  private async resolveLogo(
    candidates: LogoCandidate[],
    refererUrl: string,
  ): Promise<{
    logoUrl: string | null;
    logoSource: LogoSource | null;
    logoReady: boolean;
    logoDataUrl: string | null;
  }> {
    const empty = {
      logoUrl: null,
      logoSource: null,
      logoReady: false,
      logoDataUrl: null,
    };

    if (candidates.length === 0) return empty;

    // Probe the highest-ranked candidates CONCURRENTLY rather than one at a
    // time. A sequential walk meant one dead link (a 6s timeout) per candidate,
    // which pushed a single brand extraction past 12 seconds. One parallel round
    // costs a single round-trip instead of N, and we still pick the winner by
    // rank afterwards so the result is identical to a sequential scan.
    const probeList = candidates.slice(0, MAX_LOGO_PROBES);
    const results = await Promise.all(
      probeList.map(async (candidate) => ({
        candidate,
        asset: await this.downloadImageAsset(candidate.url, refererUrl),
      })),
    );

    // First composable candidate, honouring the original rank order.
    const composable = results.find(
      (r) => r.asset && r.asset.composable,
    );
    if (composable?.asset) {
      return {
        logoUrl: composable.candidate.url,
        logoSource: composable.candidate.source,
        logoReady: true,
        logoDataUrl: `data:${composable.asset.mimeType};base64,${composable.asset.buffer.toString('base64')}`,
      };
    }

    // Otherwise surface the best non-raster find as a preview, so the UI can
    // show the user what we did locate before asking them to upload.
    const previewFallback = results.find((r) => r.asset !== null);
    if (previewFallback) {
      this.logger.warn(
        `Only a non-raster logo was found (${previewFallback.candidate.source}). Prompting the user to upload one.`,
      );
      return {
        logoUrl: previewFallback.candidate.url,
        logoSource: previewFallback.candidate.source,
        logoReady: false,
        logoDataUrl: null,
      };
    }

    return empty;
  }

  /**
   * Downloads a remote asset and reports its MIME type. Rejects anything that
   * is not an image, is implausibly small (broken links often return a 1x1
   * spacer or an HTML error page), or is larger than 5 MB.
   */
  private async downloadImageAsset(
    url: string,
    refererUrl: string,
  ): Promise<{ mimeType: string; buffer: Buffer; composable: boolean } | null> {
    const MAX_LOGO_BYTES = 5 * 1024 * 1024;
    const MIN_LOGO_BYTES = 120; // below this it is a spacer/pixel, not a logo

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8',
          Referer: refererUrl,
        },
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timeoutId);

      if (!response.ok) return null;

      const mimeType = (response.headers.get('content-type') || '')
        .split(';')[0]
        .trim()
        .toLowerCase();
      if (!mimeType.startsWith('image/')) return null;

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < MIN_LOGO_BYTES || buffer.length > MAX_LOGO_BYTES) return null;

      // Gemini composites raster formats only.
      const composable = ['image/png', 'image/jpeg', 'image/webp'].includes(mimeType);

      return { mimeType, buffer, composable };
    } catch (err: any) {
      this.logger.debug?.(`Logo probe failed for ${url}: ${err.message}`);
      return null;
    }
  }
/**
   * Reads a `<meta>` tag's content by property/name, tolerating both the
   * property-before-content and content-before-property attribute orders.
   */
  private matchMetaContent(html: string, key: string): string | null {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match =
      html.match(
        new RegExp(
          `<meta[^>]*(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']+)["']`,
          'i',
        ),
      ) ||
      html.match(
        new RegExp(
          `<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']${escaped}["']`,
          'i',
        ),
      );
    return match ? match[1].trim() : null;
  }

  /** Returns the href of the first `<link>` whose rel matches one of `rels`. */
  private matchLinkHref(html: string, rels: string[]): string | null {
    for (const rel of rels) {
      const escaped = rel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const match =
        html.match(
          new RegExp(
            `<link[^>]*rel=["'][^"']*${escaped}[^"']*["'][^>]*href=["']([^"']+)["']`,
            'i',
          ),
        ) ||
        html.match(
          new RegExp(
            `<link[^>]*href=["']([^"']+)["'][^>]*rel=["'][^"']*${escaped}[^"']*["']`,
            'i',
          ),
        );
      if (match) return match[1].trim();
    }
    return null;
  }

  /**
   * Scrapes contact details off the page so the user can confirm them before
   * they are typeset onto the creative. `mailto:`/`tel:` links win over loose
   * text matches because they are explicitly authored by the site owner.
   */
  private extractContactDetails(
    html: string,
    text: string,
    targetUrl: string,
  ): { email: string | null; phone: string | null } {
    // Email — prefer an explicit mailto: link.
    const mailto =
      html.match(/href=["']mailto:([^"'?>\s]+)/i)?.[1]?.trim().toLowerCase() || null;
    const emailMatch =
      mailto ||
      text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] ||
      null;
    const email =
      emailMatch && /^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/.test(emailMatch)
        ? emailMatch.toLowerCase()
        : null;

    // Phone — an explicit `tel:` link is always trusted, because the site owner
    // authored it. A loose text match must additionally LOOK like a phone
    // number: bare digit runs in marketing copy are almost always a year, a
    // price or a statistic ("2025 99.999", "$1,299.00"), and printing one of
    // those as a brand contact would be an embarrassing, very visible error.
    const tel = html.match(/href=["']tel:([^"'\s>]+)/i)?.[1]?.trim() || null;
    let phone: string | null = null;

    if (tel) {
      phone = tel;
    } else {
      const candidates =
        text.match(/[\+]?[\d][\d\s().-]{6,}\d/g) || [];
      for (const raw of candidates) {
        const candidate = raw.replace(/\s+/g, ' ').trim();
        const digits = candidate.replace(/\D/g, '');

        if (digits.length < 8 || digits.length > 15) continue;
        // A decimal tail ("99.999", "1299.00") is a price or a statistic.
        if (/\.\d{1,3}\s*$/.test(candidate)) continue;
        // Require at least one real phone signal: an international prefix,
        // parenthesised area code, or an internal group separator. Without one
        // this is a bare number such as a year or a count.
        const hasPhoneSignal =
          candidate.startsWith('+') ||
          /\(\d{2,4}\)/.test(candidate) ||
          /\d[\s-]\d{3,4}[\s-]\d{3,4}/.test(candidate) ||
          /\d{3,4}-\d{3,4}-\d{3,4}/.test(candidate);
        if (!hasPhoneSignal) continue;

        phone = candidate;
        break;
      }
    }

    this.logger.debug?.(
      `Scraped contact for ${targetUrl}: email=${email ?? 'none'} phone=${phone ? 'yes' : 'none'}`,
    );

    return { email, phone };
  }
}
