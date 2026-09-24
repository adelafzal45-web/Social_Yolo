import { WebsiteAnalyzerService } from './website-analyzer.service';
import { UrlValidator } from './crawler/url-validator';
import { HttpWebsiteCrawler } from './crawler/http-website-crawler.service';
import { BrowserWebsiteCrawler } from './crawler/browser-website-crawler.service';
import { BrandAiAnalyzerService } from './ai/brand-ai-analyzer.service';
import { RedisCacheService } from '../common/cache/redis-cache.service';
import { WebsiteSnapshot } from './crawler/interfaces/website-crawler.interface';

describe('WebsiteAnalyzerService', () => {
  let service: WebsiteAnalyzerService;
  let urlValidator: jest.Mocked<UrlValidator>;
  let httpCrawler: jest.Mocked<HttpWebsiteCrawler>;
  let browserCrawler: jest.Mocked<BrowserWebsiteCrawler>;
  let aiAnalyzer: jest.Mocked<BrandAiAnalyzerService>;
  let redisCache: jest.Mocked<RedisCacheService>;

  const sampleSnapshot: WebsiteSnapshot = {
    url: 'https://linear.app/',
    title: 'Linear | The issue tracking tool you will enjoy using',
    description: 'Linear is a better way to build products.',
    headings: ['Issue tracking tool', 'Streamline software projects'],
    text: 'Linear streamlines software projects, sprints, tasks, and bug tracking for engineering teams.',
    openGraph: { siteName: 'Linear' },
    colors: ['#5E6AD2', '#F7F8F9'],
    fonts: ['Inter'],
    socialLinks: [{ platform: 'x', url: 'https://x.com/linear' }],
    images: [{ url: 'https://linear.app/screenshot.png' }],
    logo: 'https://linear.app/logo.svg',
    favicon: 'https://linear.app/favicon.ico',
    structuredData: [],
    crawledPages: [
      {
        url: 'https://linear.app/',
        pageType: 'HOMEPAGE',
        title: 'Linear',
        description: 'Linear description',
        content: 'Linear text content',
        contentHash: 'hash123',
      },
    ],
    extractedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    urlValidator = {
      normalizeUrl: jest.fn().mockReturnValue('https://linear.app/'),
      assertSafeDnsResolution: jest.fn().mockResolvedValue(undefined),
    } as any;

    httpCrawler = {
      fetch: jest.fn().mockResolvedValue(sampleSnapshot),
    } as any;

    browserCrawler = {
      fetch: jest.fn().mockResolvedValue(sampleSnapshot),
      shouldTriggerFallback: jest.fn().mockReturnValue(false),
    } as any;

    aiAnalyzer = {
      analyze: jest.fn().mockResolvedValue({
        brandName: 'Linear',
        websiteUrl: 'https://linear.app/',
        industry: 'Software & Technology',
        subIndustry: 'Project Management',
        country: null,
        city: null,
        description: 'Project tracking software.',
        companyDescription: 'Project tracking software.',
        valueProposition: 'Streamline issues and sprints.',
        logoUrl: 'https://linear.app/logo.svg',
        faviconUrl: 'https://linear.app/favicon.ico',
        primaryColor: '#5E6AD2',
        secondaryColors: ['#F7F8F9'],
        products: [{ name: 'Linear App', category: 'Software' }],
        services: [],
        targetAudience: [{ segment: 'Engineering teams' }],
        locations: [],
        benefits: [],
        painPoints: [],
        keywords: ['issue tracker', 'software'],
        categories: ['Software'],
        socialLinks: { x: 'https://x.com/linear' },
        brandVoice: {
          tone: ['modern', 'minimal'],
          formality: 'medium',
          humor: 'low',
          technicality: 'high',
          emotion: 'low',
        },
        brandImages: [],
        confidence: { brandName: 0.98 },
        sourceUrls: ['https://linear.app/'],
      }),
    } as any;

    redisCache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    } as any;

    service = new WebsiteAnalyzerService(
      urlValidator,
      httpCrawler,
      browserCrawler,
      aiAnalyzer,
      redisCache,
    );
  });

  it('orchestrates HTTP crawling and caches resulting snapshot in Redis', async () => {
    const crawlData = await service.crawlWebsite('linear.app');

    expect(urlValidator.normalizeUrl).toHaveBeenCalledWith('linear.app');
    expect(httpCrawler.fetch).toHaveBeenCalledWith('https://linear.app/', expect.any(Object));
    expect(redisCache.set).toHaveBeenCalledWith(
      'website-analysis:snapshot:https://linear.app/',
      expect.any(Object),
      expect.any(Number),
    );
    expect(crawlData.domain).toBe('linear.app');
    expect(crawlData.pages.length).toBe(1);
  });

  it('reuses cached snapshot when available without calling crawler', async () => {
    redisCache.get.mockResolvedValueOnce(sampleSnapshot);

    const crawlData = await service.crawlWebsite('linear.app');

    expect(httpCrawler.fetch).not.toHaveBeenCalled();
    expect(browserCrawler.fetch).not.toHaveBeenCalled();
    expect(crawlData.pages[0].url).toBe('https://linear.app/');
  });

  it('triggers browser crawler fallback when HTTP snapshot yields insufficient content', async () => {
    const sparseSnapshot: WebsiteSnapshot = {
      ...sampleSnapshot,
      text: 'Loading app...', // Very short (< 200 chars)
    };
    httpCrawler.fetch.mockResolvedValueOnce(sparseSnapshot);

    const richBrowserSnapshot: WebsiteSnapshot = {
      ...sampleSnapshot,
      text: 'Detailed rendered page with hundreds of characters of useful text describing products and features.',
      crawledPages: [
        {
          url: 'https://linear.app/',
          pageType: 'HOMEPAGE',
          title: 'Linear',
          description: 'Linear description',
          content: 'Detailed rendered page with hundreds of characters of useful text describing products and features.',
          contentHash: 'hash456',
        },
      ],
      isBrowserRendered: true,
    };
    browserCrawler.fetch.mockResolvedValueOnce(richBrowserSnapshot);

    const crawlData = await service.crawlWebsite('linear.app');

    expect(browserCrawler.fetch).toHaveBeenCalledWith('https://linear.app/', expect.any(Object));
    expect(crawlData.pages[0].content).toContain('Detailed rendered page');
  });

  it('builds brand profile by delegating snapshot to BrandAiAnalyzerService', async () => {
    const crawlData = await service.crawlWebsite('linear.app');
    const result = await service.buildBrandProfileWithAi(crawlData);

    expect(aiAnalyzer.analyze).toHaveBeenCalled();
    expect(result.brandName).toBe('Linear');
    expect(result.industry).toBe('Software & Technology');
  });
});
