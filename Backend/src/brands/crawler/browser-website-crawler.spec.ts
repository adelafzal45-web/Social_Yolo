import { BrowserWebsiteCrawler } from './browser-website-crawler.service';
import { UrlValidator } from './url-validator';
import { CheerioExtractor } from './cheerio-extractor';
import { WebsiteSnapshot } from './interfaces/website-crawler.interface';

describe('BrowserWebsiteCrawler', () => {
  let crawler: BrowserWebsiteCrawler;
  let urlValidator: UrlValidator;
  let extractor: CheerioExtractor;

  beforeEach(() => {
    urlValidator = new UrlValidator();
    extractor = new CheerioExtractor();
    crawler = new BrowserWebsiteCrawler(urlValidator, extractor);
  });

  describe('shouldTriggerFallback', () => {
    it('triggers fallback when text is below threshold', () => {
      const mockSnapshot: WebsiteSnapshot = {
        url: 'https://spa-app.com',
        headings: [],
        text: 'Loading...',
        images: [],
        socialLinks: [],
        colors: [],
        fonts: [],
        structuredData: [],
        extractedAt: new Date().toISOString(),
      };

      const rawHtml = '<html><body><div id="root"></div></body></html>';
      expect(crawler.shouldTriggerFallback(mockSnapshot, rawHtml)).toBe(true);
    });

    it('triggers fallback when noscript indicates javascript is required', () => {
      const mockSnapshot: WebsiteSnapshot = {
        url: 'https://spa-app.com',
        headings: [],
        text: 'You need to enable JavaScript to run this app.',
        images: [],
        socialLinks: [],
        colors: [],
        fonts: [],
        structuredData: [],
        extractedAt: new Date().toISOString(),
      };

      const rawHtml =
        '<html><body><noscript>You need to enable JavaScript to run this app.</noscript></body></html>';
      expect(crawler.shouldTriggerFallback(mockSnapshot, rawHtml)).toBe(true);
    });

    it('does not trigger fallback when page has sufficient meaningful content', () => {
      const longText = 'A'.repeat(500);
      const mockSnapshot: WebsiteSnapshot = {
        url: 'https://rich-content.com',
        headings: ['Heading 1'],
        text: longText,
        images: [],
        socialLinks: [],
        colors: [],
        fonts: [],
        structuredData: [],
        extractedAt: new Date().toISOString(),
      };

      const rawHtml = `<html><body><article><p>${longText}</p></article></body></html>`;
      expect(crawler.shouldTriggerFallback(mockSnapshot, rawHtml)).toBe(false);
    });
  });
});
