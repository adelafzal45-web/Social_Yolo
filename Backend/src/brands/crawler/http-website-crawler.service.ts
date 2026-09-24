import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  WebsiteCrawler,
  WebsiteSnapshot,
  CrawlerOptions,
  CrawledPageData,
} from './interfaces/website-crawler.interface';
import { UrlValidator } from './url-validator';
import { CheerioExtractor } from './cheerio-extractor';
import { WEBSITE_ANALYZER_CONFIG } from '../../config/website-analyzer.config';

/**
 * Production-ready HTTP crawler using native Node fetch with strict SSRF guards,
 * manual redirect validation, streaming byte limits, and selective multi-page crawling.
 */
@Injectable()
export class HttpWebsiteCrawler implements WebsiteCrawler {
  readonly name = 'http-crawler';
  private readonly logger = new Logger(HttpWebsiteCrawler.name);

  constructor(
    private readonly urlValidator: UrlValidator,
    private readonly extractor: CheerioExtractor,
  ) {}

  /**
   * Fetches website content, crawls high-value internal pages, and generates a WebsiteSnapshot.
   */
  async fetch(targetUrl: string, options?: CrawlerOptions): Promise<WebsiteSnapshot> {
    const normalizedUrl = this.urlValidator.normalizeUrl(targetUrl);
    await this.urlValidator.assertSafeDnsResolution(normalizedUrl);

    this.logger.log(`[HttpWebsiteCrawler] HTTP fetch started: ${normalizedUrl}`);
    if (options?.onStep) await options.onStep('connecting', 'Connecting to website...');

    // 1. Fetch homepage with SSRF and redirect validation
    const homeFetchResult = await this.safeFetchHtml(normalizedUrl, options);
    if (options?.onStep) await options.onStep('connected', 'Website connected');

    const snapshot = this.extractor.extractSnapshot(
      homeFetchResult.html,
      homeFetchResult.finalUrl,
      false,
    );

    const homePageHash = crypto.createHash('sha256').update(homeFetchResult.html).digest('hex');
    const crawledPages: CrawledPageData[] = [
      {
        url: homeFetchResult.finalUrl,
        pageType: 'HOMEPAGE',
        title: snapshot.title || new URL(homeFetchResult.finalUrl).hostname,
        description: snapshot.description || '',
        content: snapshot.text,
        contentHash: homePageHash,
      },
    ];

    // 2. Discover key internal pages (About, Products, Services, Contact)
    const maxInternal = options?.maxInternalPages ?? WEBSITE_ANALYZER_CONFIG.maxInternalPages;
    if (maxInternal > 0) {
      if (options?.onStep) await options.onStep('crawling', 'Collecting key internal pages...');

      const internalLinks = this.extractor.discoverInternalLinks(
        homeFetchResult.html,
        homeFetchResult.finalUrl,
        maxInternal,
      );

      for (const link of internalLinks) {
        try {
          // Re-verify safe URL before each internal crawl
          const normalizedInternal = this.urlValidator.normalizeUrl(link.url);
          await this.urlValidator.assertSafeDnsResolution(normalizedInternal);

          const pageResult = await this.safeFetchHtml(normalizedInternal, {
            ...options,
            timeoutMs: Math.min(options?.timeoutMs || WEBSITE_ANALYZER_CONFIG.timeoutMs, 8000),
          });

          const pageSnapshot = this.extractor.extractSnapshot(
            pageResult.html,
            pageResult.finalUrl,
            false,
          );

          if (pageSnapshot.text.length > 50) {
            crawledPages.push({
              url: pageResult.finalUrl,
              pageType: link.pageType,
              title: pageSnapshot.title || link.pageType,
              description: pageSnapshot.description || '',
              content: pageSnapshot.text,
              contentHash: crypto.createHash('sha256').update(pageResult.html).digest('hex'),
            });
          }
        } catch (err: any) {
          this.logger.debug(`[HttpWebsiteCrawler] Skipping internal page ${link.url}: ${err.message}`);
        }
      }
    }

    if (options?.onStep) await options.onStep('content_collected', 'Website content collected');
    this.logger.log(
      `[HttpWebsiteCrawler] HTTP fetch completed. Pages crawled: ${crawledPages.length}, text length: ${snapshot.text.length}`,
    );

    snapshot.crawledPages = crawledPages;
    snapshot.finalUrl = homeFetchResult.finalUrl;
    return snapshot;
  }

  /**
   * Safely fetches HTML with manual redirect validation (SSRF prevention) and byte size capping.
   */
  async safeFetchHtml(
    targetUrl: string,
    options?: CrawlerOptions,
  ): Promise<{ html: string; finalUrl: string }> {
    let currentUrl = targetUrl;
    const maxRedirects = 5;
    const timeoutMs = options?.timeoutMs || WEBSITE_ANALYZER_CONFIG.timeoutMs;
    const maxBytes = options?.maxResponseBytes || WEBSITE_ANALYZER_CONFIG.maxResponseBytes;

    for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(currentUrl, {
          method: 'GET',
          signal: controller.signal,
          redirect: 'manual', // Intercept all redirects to re-verify destination IPs
          headers: {
            'User-Agent': WEBSITE_ANALYZER_CONFIG.userAgent,
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
          },
        });

        // Handle Redirects safely
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          const location = response.headers.get('location');
          if (!location) {
            throw new BadRequestException('Website returned a redirect without a Location header.');
          }

          if (redirectCount >= maxRedirects) {
            throw new BadRequestException('Too many redirects encountered while accessing website.');
          }

          const nextUrl = new URL(location, currentUrl).toString();
          const normalizedRedirect = this.urlValidator.normalizeUrl(nextUrl);
          await this.urlValidator.assertSafeDnsResolution(normalizedRedirect);

          currentUrl = normalizedRedirect;
          continue; // Follow redirect safely
        }

        if (response.status === 401 || response.status === 403) {
          throw new BadRequestException('Website does not allow automated access.');
        }

        if (!response.ok) {
          throw new BadRequestException(
            `Unable to access website. Server responded with HTTP ${response.status}.`,
          );
        }

        // Validate Content-Type
        const contentType = response.headers.get('content-type') || '';
        if (
          contentType &&
          !contentType.includes('text/html') &&
          !contentType.includes('application/xhtml+xml') &&
          !contentType.includes('application/xml') &&
          !contentType.includes('text/plain')
        ) {
          throw new BadRequestException('Website returned unsupported content type.');
        }

        // Check Content-Length header if present
        const contentLengthHeader = response.headers.get('content-length');
        if (contentLengthHeader) {
          const declaredLength = parseInt(contentLengthHeader, 10);
          if (declaredLength > maxBytes) {
            throw new BadRequestException('Website response exceeds the maximum allowed size limit.');
          }
        }

        // Stream and cap response body size
        const reader = response.body?.getReader();
        if (!reader) {
          const rawText = await response.text();
          return { html: rawText.slice(0, maxBytes), finalUrl: currentUrl };
        }

        const chunks: Uint8Array[] = [];
        let totalBytes = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          if (value) {
            totalBytes += value.length;
            if (totalBytes > maxBytes) {
              await reader.cancel();
              this.logger.warn(`Truncated response for ${currentUrl} exceeding ${maxBytes} bytes`);
              break;
            }
            chunks.push(value);
          }
        }

        const decoder = new TextDecoder('utf-8');
        const combinedBuffer = Buffer.concat(chunks);
        const html = decoder.decode(combinedBuffer);

        return { html, finalUrl: currentUrl };
      } catch (err: any) {
        if (err.name === 'AbortError') {
          throw new BadRequestException('Website request timed out.');
        }
        if (err instanceof BadRequestException) {
          throw err;
        }
        this.logger.warn(`HTTP request failed for ${currentUrl}: ${err.message}`);
        throw new BadRequestException('Unable to access website.');
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new BadRequestException('Too many redirects encountered while accessing website.');
  }
}
