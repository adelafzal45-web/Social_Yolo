import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { WebsiteSnapshot, CrawledPageData } from './interfaces/website-crawler.interface';
import { WEBSITE_ANALYZER_CONFIG } from '../../config/website-analyzer.config';

/**
 * High-performance HTML and metadata extractor powered by Cheerio.
 * Extracts clean, structured brand signals without sending raw HTML to AI models.
 */
@Injectable()
export class CheerioExtractor {
  private readonly logger = new Logger(CheerioExtractor.name);

  /**
   * Parses an HTML string and extracts a structured WebsiteSnapshot.
   */
  extractSnapshot(html: string, currentUrl: string, isBrowserRendered = false): WebsiteSnapshot {
    const $ = cheerio.load(html);
    const parsedOrigin = new URL(currentUrl).origin;

    const metaTags = this.extractMetaTags($);
    const openGraph = this.extractOpenGraph(metaTags);
    const twitter = this.extractTwitter(metaTags);
    const structuredData = this.extractJsonLd($);
    const headings = this.extractHeadings($);
    const text = this.extractCleanText($);
    const socialLinks = this.extractSocialLinks($);
    const images = this.extractImages($, parsedOrigin);
    const { logo, favicon, availableLogos } = this.extractLogos(
      $,
      parsedOrigin,
      openGraph?.image,
      structuredData,
    );
    const colors = this.extractColors($, html);
    const fonts = this.extractFonts($, html);

    const title =
      $('title').first().text().trim() ||
      openGraph?.title ||
      twitter?.title ||
      headings[0] ||
      undefined;

    const description =
      metaTags['description'] ||
      openGraph?.description ||
      twitter?.description ||
      undefined;

    const language = $('html').attr('lang')?.trim() || metaTags['language'] || undefined;
    const canonicalUrl = $('link[rel="canonical"]').attr('href')?.trim() || openGraph?.url;
    const viewport = metaTags['viewport'] || undefined;

    return {
      url: currentUrl,
      finalUrl: currentUrl,
      title,
      description,
      headings,
      text,
      language,
      canonicalUrl,
      viewport,
      openGraph,
      twitter,
      images,
      logo,
      favicon,
      availableLogos,
      socialLinks,
      colors,
      fonts,
      structuredData,
      extractedAt: new Date().toISOString(),
      isBrowserRendered,
    };
  }

  /**
   * Extracts clean, readable text stripped of boilerplate, script, style, and tracking banners.
   */
  extractCleanText($: cheerio.CheerioAPI): string {
    const body = $('body').clone();

    // Strip script, styles, navigation, footer, forms, and cookie/tracking elements
    body
      .find(
        'script, style, noscript, svg, iframe, nav, footer, header, form, link, meta, template, select, option, ' +
          '[aria-hidden="true"], [role="dialog"], [class*="cookie" i], [id*="cookie" i], [class*="consent" i], ' +
          '[id*="consent" i], [class*="banner" i], [id*="banner" i], [class*="modal" i], [id*="modal" i]',
      )
      .remove();

    const textBlocks: string[] = [];
    body
      .find(
        'h1, h2, h3, h4, p, li, blockquote, [class*="hero" i], [class*="about" i], [class*="feature" i], [class*="desc" i]',
      )
      .each((_, el) => {
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        if (text.length > 20 && !textBlocks.includes(text)) {
          textBlocks.push(text);
        }
      });

    // Fallback for custom web components, div/span layouts, or modern SPAs
    if (textBlocks.length < 2) {
      body
        .find('main *, article *, section *, [role="main"] *, div, span')
        .each((_, el) => {
          if ($(el).children().length <= 2) {
            const text = $(el).text().replace(/\s+/g, ' ').trim();
            if (text.length > 25 && !textBlocks.includes(text)) {
              textBlocks.push(text);
            }
          }
        });
    }

    // Ultimate fallback to stripped body text if tags are heavily nested
    if (textBlocks.length === 0) {
      const fallbackText = body.text().replace(/\s+/g, ' ').trim();
      if (fallbackText.length > 20) {
        textBlocks.push(fallbackText.slice(0, 5000));
      }
    }

    const combined = textBlocks.join('\n');
    return combined.slice(0, WEBSITE_ANALYZER_CONFIG.maxTextLength);
  }

  /**
   * Extracts headings (H1, H2, H3, H4) in reading order.
   */
  extractHeadings($: cheerio.CheerioAPI): string[] {
    const headings: string[] = [];
    $('h1, h2, h3, h4').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text.length > 2 && text.length < 200 && !headings.includes(text)) {
        headings.push(text);
      }
    });
    return headings.slice(0, WEBSITE_ANALYZER_CONFIG.maxHeadings);
  }

  /**
   * Extracts all meta tags into a normalized dictionary.
   */
  extractMetaTags($: cheerio.CheerioAPI): Record<string, string> {
    const tags: Record<string, string> = {};
    $('meta').each((_, el) => {
      const name = $(el).attr('name') || $(el).attr('property') || $(el).attr('http-equiv');
      const content = $(el).attr('content');
      if (name && content) {
        tags[name.toLowerCase().trim()] = content.trim();
      }
    });
    return tags;
  }

  /**
   * Extracts Open Graph metadata.
   */
  extractOpenGraph(metaTags: Record<string, string>): WebsiteSnapshot['openGraph'] {
    const ogTitle = metaTags['og:title'];
    const ogDescription = metaTags['og:description'];
    const ogImage = metaTags['og:image'] || metaTags['og:image:url'];
    const ogUrl = metaTags['og:url'];
    const ogSiteName = metaTags['og:site_name'];
    const ogType = metaTags['og:type'];

    if (!ogTitle && !ogDescription && !ogImage && !ogSiteName) {
      return undefined;
    }

    return {
      title: ogTitle,
      description: ogDescription,
      image: ogImage,
      url: ogUrl,
      siteName: ogSiteName,
      type: ogType,
    };
  }

  /**
   * Extracts Twitter Card metadata.
   */
  extractTwitter(metaTags: Record<string, string>): WebsiteSnapshot['twitter'] {
    const title = metaTags['twitter:title'];
    const description = metaTags['twitter:description'];
    const image = metaTags['twitter:image'] || metaTags['twitter:image:src'];
    const card = metaTags['twitter:card'];

    if (!title && !description && !image && !card) {
      return undefined;
    }

    return {
      title,
      description,
      image,
      card,
    };
  }

  /**
   * Extracts JSON-LD Schema.org data blocks, safely ignoring malformed entries.
   */
  extractJsonLd($: cheerio.CheerioAPI): unknown[] {
    const records: unknown[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const raw = $(el).html()?.trim();
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            records.push(...parsed);
          } else if (parsed && typeof parsed === 'object') {
            records.push(parsed);
          }
        }
      } catch (err: any) {
        // Silently skip malformed JSON-LD scripts without failing analysis
      }
    });
    return records;
  }

  /**
   * Extracts candidate brand logos and favicon.
   */
  extractLogos(
    $: cheerio.CheerioAPI,
    origin: string,
    ogImage?: string,
    jsonLdRecords: unknown[] = [],
  ): { logo?: string; favicon?: string; availableLogos: string[] } {
    let logo: string | undefined = undefined;
    const candidates = new Set<string>();

    // 1. Check JSON-LD logo
    for (const record of jsonLdRecords as any[]) {
      if (record && record.logo) {
        const candidate = typeof record.logo === 'string' ? record.logo : record.logo.url;
        if (candidate) {
          try {
            const resolved = new URL(candidate, origin).toString();
            candidates.add(resolved);
            if (!logo) logo = resolved;
          } catch {}
        }
      }
    }

    // 2. Check DOM logo selectors
    $('header img[src*="logo" i], nav img[src*="logo" i], a[class*="logo" i] img, img[alt*="logo" i], [id*="logo" i] img, img[src*="brand" i]').each(
      (_, el) => {
        const src = $(el).attr('src');
        if (src && !src.startsWith('data:')) {
          try {
            const resolved = new URL(src, origin).toString();
            candidates.add(resolved);
            if (!logo) logo = resolved;
          } catch {}
        }
      },
    );

    // 3. Check OpenGraph image fallback candidate
    if (ogImage) {
      try {
        const resolved = new URL(ogImage, origin).toString();
        candidates.add(resolved);
      } catch {}
    }

    // 4. Favicon detection
    let favicon: string | undefined = undefined;
    const faviconHref =
      $('link[rel="apple-touch-icon"]').attr('href') ||
      $('link[rel="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href');

    if (faviconHref) {
      try {
        favicon = new URL(faviconHref, origin).toString();
      } catch {
        favicon = `${origin}/favicon.ico`;
      }
    } else {
      favicon = `${origin}/favicon.ico`;
    }

    if (favicon && !favicon.endsWith('.ico')) {
      candidates.add(favicon);
    }

    const availableLogos = Array.from(candidates).slice(0, 10);
    if (!logo && availableLogos.length > 0) {
      logo = availableLogos[0];
    }

    return {
      logo,
      favicon,
      availableLogos,
    };
  }

  /**
   * Extracts visual image elements with alt tags and dimensions.
   */
  extractImages($: cheerio.CheerioAPI, origin: string): WebsiteSnapshot['images'] {
    const images: WebsiteSnapshot['images'] = [];
    const seenUrls = new Set<string>();

    $('img[src]').each((_, el) => {
      const src = $(el).attr('src')?.trim();
      if (!src || src.startsWith('data:') || src.includes('avatar') || src.includes('spinner')) {
        return;
      }

      try {
        const resolved = new URL(src, origin).toString();
        if (seenUrls.has(resolved)) return;
        seenUrls.add(resolved);

        const alt = $(el).attr('alt')?.trim();
        const widthRaw = $(el).attr('width');
        const heightRaw = $(el).attr('height');
        const width = widthRaw ? parseInt(widthRaw, 10) : undefined;
        const height = heightRaw ? parseInt(heightRaw, 10) : undefined;

        images.push({
          url: resolved,
          alt: alt || undefined,
          width: Number.isFinite(width) ? width : undefined,
          height: Number.isFinite(height) ? height : undefined,
        });
      } catch {}
    });

    return images.slice(0, WEBSITE_ANALYZER_CONFIG.maxImages);
  }

  /**
   * Extracts official social media profile links.
   */
  extractSocialLinks($: cheerio.CheerioAPI): WebsiteSnapshot['socialLinks'] {
    const socialLinks: WebsiteSnapshot['socialLinks'] = [];
    const seenPlatforms = new Set<string>();

    const patterns: Array<{ platform: string; regex: RegExp }> = [
      { platform: 'instagram', regex: /instagram\.com\/([a-zA-Z0-9_.-]+)\/?$/i },
      { platform: 'facebook', regex: /facebook\.com\/([a-zA-Z0-9_.-]+)\/?$/i },
      { platform: 'linkedin', regex: /linkedin\.com\/(?:company|in)\/([a-zA-Z0-9_.-]+)\/?$/i },
      { platform: 'x', regex: /(?:twitter|x)\.com\/([a-zA-Z0-9_.-]+)\/?$/i },
      { platform: 'youtube', regex: /youtube\.com\/(?:@|c\/|channel\/)?([a-zA-Z0-9_.-]+)\/?$/i },
      { platform: 'tiktok', regex: /tiktok\.com\/@?([a-zA-Z0-9_.-]+)\/?$/i },
      { platform: 'pinterest', regex: /pinterest\.com\/([a-zA-Z0-9_.-]+)\/?$/i },
    ];

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')?.trim();
      if (!href) return;

      // Filter out generic social sharing links
      if (href.includes('sharer') || href.includes('intent') || href.includes('shareArticle')) {
        return;
      }

      for (const { platform, regex } of patterns) {
        if (!seenPlatforms.has(platform) && regex.test(href)) {
          seenPlatforms.add(platform);
          socialLinks.push({ platform, url: href });
        }
      }
    });

    return socialLinks;
  }

  /**
   * Extracts dominant brand visual colors from HTML styles and theme-color meta tag.
   */
  extractColors($: cheerio.CheerioAPI, html: string): string[] {
    const colorCounts: Record<string, number> = {};

    const themeColor = $('meta[name="theme-color"]').attr('content')?.trim();
    if (themeColor && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(themeColor)) {
      colorCounts[themeColor.toUpperCase()] = (colorCounts[themeColor.toUpperCase()] || 0) + 10;
    }

    const hexRegex = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
    const matches = html.match(hexRegex) || [];

    const ignoredColors = new Set([
      '#FFFFFF',
      '#000000',
      '#FFF',
      '#000',
      '#E5E7EB',
      '#F3F4F6',
      '#D1D5DB',
      '#9CA3AF',
      '#1F2937',
      '#111827',
      '#F9FAFB',
      '#FAFAFA',
      '#EEEEEE',
      '#CCCCCC',
    ]);

    for (const match of matches) {
      const normalized = match.toUpperCase();
      if (!ignoredColors.has(normalized)) {
        colorCounts[normalized] = (colorCounts[normalized] || 0) + 1;
      }
    }

    return Object.keys(colorCounts)
      .sort((a, b) => colorCounts[b] - colorCounts[a])
      .slice(0, 6);
  }

  /**
   * Extracts typography brand signals from font links and CSS declarations.
   */
  extractFonts($: cheerio.CheerioAPI, html: string): string[] {
    const fonts = new Set<string>();

    // Google Fonts and CDN links
    $('link[href*="fonts.googleapis.com"], link[href*="fonts.cdnfonts.com"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const match = href.match(/family=([^&:]+)/);
      if (match && match[1]) {
        const name = decodeURIComponent(match[1].replace(/\+/g, ' ')).split(',')[0].trim();
        if (name) fonts.add(name);
      }
    });

    // font-family CSS declarations
    const fontRegex = /font-family:\s*['"]?([a-zA-Z\s\-]+)['"]?(?:,|$)/gi;
    let match: RegExpExecArray | null;
    while ((match = fontRegex.exec(html)) !== null) {
      const font = match[1].trim();
      const generic = ['sans-serif', 'serif', 'monospace', 'inherit', 'initial', 'system-ui', 'ui-sans-serif'];
      if (!generic.includes(font.toLowerCase()) && font.length > 2 && font.length < 35) {
        fonts.add(font);
        if (fonts.size >= 4) break;
      }
    }

    return Array.from(fonts).slice(0, 4);
  }

  /**
   * Identifies internal high-value navigation links (About, Products, Services, Contact).
   */
  discoverInternalLinks(
    html: string,
    currentUrl: string,
    maxLinks = 5,
  ): Array<{ url: string; pageType: CrawledPageData['pageType'] }> {
    const $ = cheerio.load(html);
    const origin = new URL(currentUrl).origin;
    const results: Array<{ url: string; pageType: CrawledPageData['pageType'] }> = [];
    const seen = new Set<string>([currentUrl, currentUrl.replace(/\/$/, '')]);

    $('a[href]').each((_, el) => {
      if (results.length >= maxLinks) return;

      const href = $(el).attr('href')?.trim();
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      try {
        const resolved = new URL(href, origin);
        if (resolved.origin !== origin) return; // Restrict strictly to same origin

        const cleanUrl = resolved.origin + resolved.pathname.replace(/\/$/, '');
        if (seen.has(cleanUrl)) return;

        const pathLower = resolved.pathname.toLowerCase();
        let pageType: CrawledPageData['pageType'] | null = null;

        if (/about|story|company|who-we-are/i.test(pathLower)) {
          pageType = 'ABOUT';
        } else if (/product|shop|store|collection|item/i.test(pathLower)) {
          pageType = 'PRODUCT';
        } else if (/service|solution|what-we-do|offer/i.test(pathLower)) {
          pageType = 'SERVICE';
        } else if (/contact|reach-us|get-in-touch|location/i.test(pathLower)) {
          pageType = 'CONTACT';
        }

        if (pageType) {
          seen.add(cleanUrl);
          results.push({ url: resolved.toString(), pageType });
        }
      } catch {}
    });

    return results;
  }
}
