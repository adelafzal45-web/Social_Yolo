import { BrandAnalysisProcessor } from './brand-analysis.processor';
import { WebsiteAnalyzerService } from './website-analyzer.service';
import { RedisCacheService } from '../common/cache/redis-cache.service';

describe('BrandAnalysisProcessor', () => {
  let processor: BrandAnalysisProcessor;
  let redisCache: jest.Mocked<RedisCacheService>;
  let websiteAnalyzer: jest.Mocked<WebsiteAnalyzerService>;
  const store = new Map<string, any>();

  beforeEach(() => {
    store.clear();
    redisCache = {
      get: jest.fn().mockImplementation((key: string) => Promise.resolve(store.get(key) || null)),
      set: jest.fn().mockImplementation((key: string, val: any) => {
        store.set(key, val);
        return Promise.resolve();
      }),
    } as any;

    websiteAnalyzer = {
      normalizeUrl: jest.fn().mockReturnValue('https://example.com/'),
      crawlWebsite: jest.fn().mockResolvedValue({
        url: 'https://example.com/',
        domain: 'example.com',
        pages: [],
        assets: {
          logoUrl: null,
          faviconUrl: null,
          availableLogos: [],
          primaryColor: '#7c5cff',
          secondaryColor: null,
          accentColor: null,
          secondaryColors: [],
          fontHeading: null,
          fontBody: null,
          socialLinks: {},
          brandImages: [],
        },
        metaTags: {},
        jsonLd: [],
      }),
      buildBrandProfileWithAi: jest.fn().mockResolvedValue({
        brandName: 'Example Brand',
        websiteUrl: 'https://example.com/',
        industry: 'Technology',
        subIndustry: null,
        country: null,
        city: null,
        description: 'Example description',
        companyDescription: 'Example company',
        valueProposition: null,
        logoUrl: null,
        faviconUrl: null,
        primaryColor: '#7c5cff',
        secondaryColors: [],
        products: [],
        services: [],
        targetAudience: [],
        locations: [],
        benefits: [],
        painPoints: [],
        keywords: [],
        categories: [],
        socialLinks: {},
        brandVoice: {
          tone: ['modern'],
          formality: 'medium',
          humor: 'low',
          technicality: 'medium',
          emotion: 'medium',
        },
        brandImages: [],
        confidence: { brandName: 0.9 },
        sourceUrls: [],
      }),
    } as any;

    processor = new BrandAnalysisProcessor(redisCache, websiteAnalyzer);
  });

  it('creates an analysis job and stores initial state in Redis', async () => {
    const jobId = await processor.createJob('example.com');
    expect(jobId).toMatch(/^job_/);

    const job = await processor.getJob(jobId);
    expect(job).toBeDefined();
    expect(job?.url).toBe('https://example.com/');
    expect(job?.status).toBe('queued');
    expect(job?.progress).toBe(5);
    expect(job?.steps.length).toBe(7);
  });

  it('reuses existing active or completed job for duplicate submissions when not forceFresh', async () => {
    const firstJobId = await processor.createJob('example.com');
    // Simulate job in progress
    const job = await processor.getJob(firstJobId);
    if (job) {
      job.status = 'processing';
      await redisCache.set(`brand_analysis:${firstJobId}`, job);
    }

    const secondJobId = await processor.createJob('example.com', undefined, false);
    expect(secondJobId).toBe(firstJobId);
  });

  it('creates new fresh job when forceFresh is true', async () => {
    const firstJobId = await processor.createJob('example.com');
    const secondJobId = await processor.createJob('example.com', undefined, true);
    expect(secondJobId).not.toBe(firstJobId);
  });
});
