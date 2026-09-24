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
 * Headless browser crawler powered by Playwright.
 * Only activated as a fallback for JavaScript-rendered Single Page Applications (SPAs).
 */
@Injectable()
export class BrowserWebsiteCrawler implements WebsiteCrawler {
  readonly name = 'browser-crawler';
  private readonly logger = new Logger(BrowserWebsiteCrawler.name);

  constructor(
    private readonly urlValidator: UrlValidator,
    private readonly extractor: CheerioExtractor,
  ) {}

  /**
   * Evaluates whether an HTTP-extracted snapshot has insufficient content
   * and indicates a JavaScript-heavy SPA requiring browser execution.
   */
  shouldTriggerFallback(snapshot: WebsiteSnapshot, rawHtml: string): boolean {
    if (!WEBSITE_ANALYZER_CONFIG.browserFallbackEnabled) {
      return false;
    }

    const textLength = snapshot.text.trim().length;
    const isVeryShort = textLength < WEBSITE_ANALYZER_CONFIG.minMeaningfulContentLength;

    // Detect common SPA empty shells (React, Vue, Angular, Next, Svelte)
    const hasSpaShell =
      /<div\s+id=["'](root|app|__next)["']\s*>\s*<\/div>/i.test(rawHtml) ||
      /<noscript>.*?(enable javascript|javascript is required).*?<\/noscript>/i.test(rawHtml) ||
      (textLength < 400 && /<script[^>]+src=[^>]+app|bundle|main|chunk/i.test(rawHtml));

    return isVeryShort || hasSpaShell;
  }

  /**
   * Launches headless Chromium, renders the target website, and returns an extracted WebsiteSnapshot.
   */
  async fetch(targetUrl: string, options?: CrawlerOptions): Promise<WebsiteSnapshot> {
    if (!WEBSITE_ANALYZER_CONFIG.browserFallbackEnabled) {
      throw new BadRequestException('Website requires browser rendering but rendering is disabled.');
    }

    const normalizedUrl = this.urlValidator.normalizeUrl(targetUrl);
    await this.urlValidator.assertSafeDnsResolution(normalizedUrl);

    this.logger.log(`[BrowserWebsiteCrawler] Launching headless browser for: ${normalizedUrl}`);
    if (options?.onStep) {
      await options.onStep('browser_render', 'Rendering JavaScript content with browser engine...');
    }

    let playwrightModule: typeof import('playwright') | null = null;
    try {
      playwrightModule = require('playwright');
    } catch (err: any) {
      this.logger.warn(`[BrowserWebsiteCrawler] Playwright is not installed: ${err.message}`);
      throw new BadRequestException('Website requires browser rendering but rendering failed.');
    }

    let browser: any = null;
    let context: any = null;
    let page: any = null;

    try {
      try {
        browser = await playwrightModule!.chromium.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-extensions',
          ],
        });
      } catch (primaryLaunchErr: any) {
        // Fallback to system-installed Chrome or Edge if bundled Chromium binary isn't found
        try {
          browser = await playwrightModule!.chromium.launch({
            headless: true,
            channel: 'chrome',
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
          });
        } catch {
          try {
            browser = await playwrightModule!.chromium.launch({
              headless: true,
              channel: 'msedge',
              args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });
          } catch {
            throw primaryLaunchErr;
          }
        }
      }

      context = await browser.newContext({
        userAgent: WEBSITE_ANALYZER_CONFIG.userAgent,
        viewport: { width: 1280, height: 800 },
        ignoreHTTPSErrors: true,
      });

      page = await context.newPage();

      // Optimize rendering: abort heavy video/media/font downloads while preserving styles and scripts
      await page.route('**/*', (route: any) => {
        const req = route.request();
        const type = req.resourceType();
        if (type === 'media' || (type === 'image' && !req.url().includes('logo'))) {
          route.abort();
        } else {
          route.continue();
        }
      });

      const timeoutMs = options?.timeoutMs || WEBSITE_ANALYZER_CONFIG.timeoutMs;

      // Navigate and wait for DOM stabilization
      const response = await page.goto(normalizedUrl, {
        waitUntil: 'domcontentloaded',
        timeout: timeoutMs,
      });

      if (!response) {
        throw new BadRequestException('Website requires browser rendering but rendering failed.');
      }

      // Check final URL for SSRF in case client-side redirect occurred
      const finalUrl = page.url();
      const normalizedFinalUrl = this.urlValidator.normalizeUrl(finalUrl);
      await this.urlValidator.assertSafeDnsResolution(normalizedFinalUrl);

      // Wait briefly for network idle or client-side SPA hydration
      try {
        await page.waitForLoadState('networkidle', { timeout: 2500 });
      } catch {}
      await page.waitForTimeout(800);

      const renderedHtml = await page.content();
      this.logger.log(
        `[BrowserWebsiteCrawler] Rendered HTML successfully (${renderedHtml.length} chars) for ${normalizedFinalUrl}`,
      );

      const snapshot = this.extractor.extractSnapshot(renderedHtml, normalizedFinalUrl, true);
      const contentHash = crypto.createHash('sha256').update(renderedHtml).digest('hex');

      const crawledPages: CrawledPageData[] = [
        {
          url: normalizedFinalUrl,
          pageType: 'HOMEPAGE',
          title: snapshot.title || new URL(normalizedFinalUrl).hostname,
          description: snapshot.description || '',
          content: snapshot.text,
          contentHash,
        },
      ];

      snapshot.crawledPages = crawledPages;
      snapshot.finalUrl = normalizedFinalUrl;
      return snapshot;
    } catch (err: any) {
      this.logger.warn(`[BrowserWebsiteCrawler] Rendering failed for ${normalizedUrl}: ${err.message}`);
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException('Website requires browser rendering but rendering failed.');
    } finally {
      if (page) await page.close().catch(() => {});
      if (context) await context.close().catch(() => {});
      if (browser) await browser.close().catch(() => {});
    }
  }
}
