import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { UrlValidator } from './crawler/url-validator';
import { HttpWebsiteCrawler } from './crawler/http-website-crawler.service';
import { BrowserWebsiteCrawler } from './crawler/browser-website-crawler.service';
import { BrandAiAnalyzerService } from './ai/brand-ai-analyzer.service';
import { WebsiteSnapshot, CrawledPageData } from './crawler/interfaces/website-crawler.interface';
import { RedisCacheService } from '../common/cache/redis-cache.service';
import { WEBSITE_ANALYZER_CONFIG } from '../config/website-analyzer.config';

export interface CrawledPage {
  url: string;
  pageType: 'HOMEPAGE' | 'ABOUT' | 'PRODUCT' | 'SERVICE' | 'BLOG' | 'CONTACT' | 'OTHER';
  title: string;
  description: string;
  content: string;
  contentHash: string;
}

export interface ExtractedAssets {
  logoUrl: string | null;
  faviconUrl: string | null;
  availableLogos: string[];
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  secondaryColors: string[];
  fontHeading: string | null;
  fontBody: string | null;
  socialLinks: Record<string, string>;
  brandImages: string[];
}

export interface ExtractedWebsiteData {
  url: string;
  domain: string;
  pages: CrawledPage[];
  assets: ExtractedAssets;
  metaTags: Record<string, string>;
  jsonLd: Record<string, any>[];
  snapshot?: WebsiteSnapshot;
}

export interface BrandAnalysisResult {
  brandName: string;
  tagline?: string | null;
  websiteUrl: string;
  industry: string | null;
  subIndustry: string | null;
  country: string | null;
  city: string | null;
  description: string | null;
  companyDescription: string | null;
  valueProposition: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  availableLogos?: string[];
  primaryColor: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  secondaryColors: string[];
  fontHeading?: string | null;
  fontBody?: string | null;
  tone?: string | null;
  products: { name: string; description?: string; category?: string }[];
  services: { name: string; description?: string }[];
  targetAudience: { segment: string; description?: string; demographics?: string }[];
  locations: { country?: string; city?: string; region?: string }[];
  benefits: string[];
  painPoints: string[];
  keywords: string[];
  categories: string[];
  socialLinks: Record<string, string>;
  brandVoice: {
    tone: string[];
    formality: string;
    humor: string;
    technicality: string;
    emotion: string;
  };
  brandImages: string[];
  confidence: Record<string, number>;
  sourceUrls: string[];
}

export type { WebsiteSnapshot };

/**
 * Orchestrator service for website analysis and brand intelligence.
 * Coordinates local HTTP crawling, Playwright browser fallback for JS-heavy sites,
 * snapshot caching in Redis, and Gemini AI interpretation.
 */
@Injectable()
export class WebsiteAnalyzerService {
  private readonly logger = new Logger(WebsiteAnalyzerService.name);

  constructor(
    private readonly urlValidator: UrlValidator,
    private readonly httpCrawler: HttpWebsiteCrawler,
    private readonly browserCrawler: BrowserWebsiteCrawler,
    private readonly aiAnalyzer: BrandAiAnalyzerService,
    private readonly redisCache: RedisCacheService,
  ) {}

  /**
   * Validates and normalizes target website URL.
   */
  normalizeUrl(rawUrl: string): string {
    return this.urlValidator.normalizeUrl(rawUrl);
  }

  /**
   * Complete website crawl orchestrator:
   * 1. Checks Redis cache for recent snapshot.
   * 2. Executes HttpWebsiteCrawler.
   * 3. Evaluates if content is insufficient / JS-heavy, falling back to BrowserWebsiteCrawler.
   * 4. Caches resulting snapshot.
   */
  async crawlWebsite(
    targetUrl: string,
    onStep?: (stepId: string, label: string) => Promise<void> | void,
    forceFresh = false,
  ): Promise<ExtractedWebsiteData> {
    const normalizedUrl = this.normalizeUrl(targetUrl);
    const domain = new URL(normalizedUrl).hostname;
    const cacheKey = `website-analysis:snapshot:${normalizedUrl}`;

    this.logger.log(`[WebsiteAnalyzerService] Starting website analysis: ${normalizedUrl}`);

    // Check Redis cache if fresh crawl not explicitly forced
    if (!forceFresh) {
      try {
        const cachedSnapshot = await this.redisCache.get<WebsiteSnapshot>(cacheKey);
        if (cachedSnapshot && cachedSnapshot.crawledPages && cachedSnapshot.crawledPages.length > 0) {
          this.logger.log(`[WebsiteAnalyzerService] Cache hit for URL: ${normalizedUrl}`);
          if (onStep) {
            await onStep('connected', 'Website connected (cached)');
            await onStep('content_collected', 'Website content retrieved from cache');
          }
          return this.snapshotToExtractedData(cachedSnapshot, domain);
        }
      } catch (err: any) {
        this.logger.debug(`[WebsiteAnalyzerService] Cache lookup error: ${err.message}`);
      }
    }

    // Step 1: Default fast HTTP crawl
    let snapshot: WebsiteSnapshot;
    try {
      snapshot = await this.httpCrawler.fetch(normalizedUrl, { onStep });
    } catch (httpErr: any) {
      // If HTTP fetch threw an automated access block or failure, check if browser crawler should try
      if (WEBSITE_ANALYZER_CONFIG.browserFallbackEnabled) {
        this.logger.warn(
          `[WebsiteAnalyzerService] HTTP fetch encountered: ${httpErr.message}. Attempting browser crawler fallback.`,
        );
        try {
          snapshot = await this.browserCrawler.fetch(normalizedUrl, { onStep });
        } catch (browserErr: any) {
          throw httpErr; // Re-throw original or browser error
        }
      } else {
        throw httpErr;
      }
    }

    // Step 2: Check if extracted page has insufficient content and requires browser rendering
    const hasInsufficientContent =
      snapshot.text.trim().length < WEBSITE_ANALYZER_CONFIG.minMeaningfulContentLength;

    if (hasInsufficientContent && WEBSITE_ANALYZER_CONFIG.browserFallbackEnabled && !snapshot.isBrowserRendered) {
      this.logger.log(
        `[WebsiteAnalyzerService] Insufficient content detected (${snapshot.text.trim().length} chars). Invoking Playwright browser fallback...`,
      );
      try {
        const browserSnapshot = await this.browserCrawler.fetch(normalizedUrl, { onStep });
        if (browserSnapshot.text.length > snapshot.text.length || snapshot.text.trim().length === 0) {
          snapshot = browserSnapshot;
          this.logger.log(
            `[WebsiteAnalyzerService] Browser fallback succeeded. Enhanced content length: ${snapshot.text.length}`,
          );
        }
      } catch (err: any) {
        this.logger.warn(`[WebsiteAnalyzerService] Browser fallback failed: ${err.message}. Retaining HTTP snapshot.`);
        if (snapshot.text.trim().length === 0 && !snapshot.title && !snapshot.description) {
          throw new BadRequestException('Website requires browser rendering but rendering failed.');
        }
      }
    } else {
      this.logger.log(`[WebsiteAnalyzerService] Browser fallback not required.`);
    }

    // Ensure snapshot has at least fallback text if title/description were retrieved
    if (snapshot.text.trim().length === 0) {
      if (snapshot.description) {
        snapshot.text = `${snapshot.title ? snapshot.title + '\n' : ''}${snapshot.description}`;
      } else if (snapshot.title) {
        snapshot.text = snapshot.title;
      } else {
        throw new BadRequestException('Website content could not be extracted.');
      }
    }

    // Cache the snapshot in Redis
    try {
      await this.redisCache.set(cacheKey, snapshot, WEBSITE_ANALYZER_CONFIG.cacheTtlSeconds);
    } catch (cacheSetErr: any) {
      this.logger.debug(`[WebsiteAnalyzerService] Failed to cache snapshot: ${cacheSetErr.message}`);
    }

    return this.snapshotToExtractedData(snapshot, domain);
  }

  /**
   * Synthesizes brand profile with Gemini AI from crawled website data.
   */
  async buildBrandProfileWithAi(
    crawlData: ExtractedWebsiteData,
    onStep?: (stepId: string, label: string) => Promise<void> | void,
  ): Promise<BrandAnalysisResult> {
    const snapshot = crawlData.snapshot || this.extractedDataToSnapshot(crawlData);
    return this.aiAnalyzer.analyze(snapshot, onStep);
  }

  /**
   * Helper to map WebsiteSnapshot to ExtractedWebsiteData for backward compatibility.
   */
  private snapshotToExtractedData(snapshot: WebsiteSnapshot, domain: string): ExtractedWebsiteData {
    const pages: CrawledPage[] = (snapshot.crawledPages || []).map((p) => ({
      url: p.url,
      pageType: p.pageType,
      title: p.title,
      description: p.description,
      content: p.content,
      contentHash: p.contentHash,
    }));

    if (pages.length === 0) {
      pages.push({
        url: snapshot.url,
        pageType: 'HOMEPAGE',
        title: snapshot.title || domain,
        description: snapshot.description || '',
        content: snapshot.text,
        contentHash: '',
      });
    }

    const socialLinksMap: Record<string, string> = {};
    for (const s of snapshot.socialLinks || []) {
      socialLinksMap[s.platform] = s.url;
    }

    const metaTags: Record<string, string> = {};
    if (snapshot.description) metaTags['description'] = snapshot.description;
    if (snapshot.openGraph?.title) metaTags['og:title'] = snapshot.openGraph.title;
    if (snapshot.openGraph?.description) metaTags['og:description'] = snapshot.openGraph.description;
    if (snapshot.openGraph?.siteName) metaTags['og:site_name'] = snapshot.openGraph.siteName;

    const assets: ExtractedAssets = {
      logoUrl: snapshot.logo || null,
      faviconUrl: snapshot.favicon || null,
      availableLogos: snapshot.availableLogos || [],
      primaryColor: snapshot.colors[0] || null,
      secondaryColor: snapshot.colors[1] || null,
      accentColor: snapshot.colors[2] || null,
      secondaryColors: snapshot.colors.slice(1),
      fontHeading: snapshot.fonts[0] || null,
      fontBody: snapshot.fonts[1] || snapshot.fonts[0] || null,
      socialLinks: socialLinksMap,
      brandImages: (snapshot.images || []).map((img) => img.url),
    };

    return {
      url: snapshot.url,
      domain,
      pages,
      assets,
      metaTags,
      jsonLd: (snapshot.structuredData as Record<string, any>[]) || [],
      snapshot,
    };
  }

  /**
   * Helper to convert ExtractedWebsiteData back to a WebsiteSnapshot.
   */
  private extractedDataToSnapshot(data: ExtractedWebsiteData): WebsiteSnapshot {
    const socialLinksList = Object.entries(data.assets.socialLinks || {}).map(([platform, url]) => ({
      platform,
      url,
    }));

    const imagesList = (data.assets.brandImages || []).map((url) => ({ url }));

    const colors: string[] = [];
    if (data.assets.primaryColor) colors.push(data.assets.primaryColor);
    if (data.assets.secondaryColor) colors.push(data.assets.secondaryColor);
    if (data.assets.accentColor) colors.push(data.assets.accentColor);
    if (data.assets.secondaryColors) {
      for (const c of data.assets.secondaryColors) {
        if (!colors.includes(c)) colors.push(c);
      }
    }

    const fonts: string[] = [];
    if (data.assets.fontHeading) fonts.push(data.assets.fontHeading);
    if (data.assets.fontBody) fonts.push(data.assets.fontBody);

    const fullText = data.pages.map((p) => p.content).join('\n\n');

    return {
      url: data.url,
      title: data.pages[0]?.title,
      description: data.metaTags['description'] || data.pages[0]?.description,
      headings: [],
      text: fullText,
      openGraph: {
        siteName: data.metaTags['og:site_name'],
        title: data.metaTags['og:title'],
        description: data.metaTags['og:description'],
      },
      images: imagesList,
      logo: data.assets.logoUrl || undefined,
      favicon: data.assets.faviconUrl || undefined,
      availableLogos: data.assets.availableLogos,
      socialLinks: socialLinksList,
      colors,
      fonts,
      structuredData: data.jsonLd,
      crawledPages: data.pages,
      extractedAt: new Date().toISOString(),
    };
  }
}
