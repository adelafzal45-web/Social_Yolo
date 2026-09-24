import { BadRequestException } from '@nestjs/common';
import { BrandAiAnalyzerService } from './brand-ai-analyzer.service';
import { WebsiteSnapshot } from '../crawler/interfaces/website-crawler.interface';

// Mock @google/genai module
const mockGenerateContent = jest.fn();
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
}));

describe('BrandAiAnalyzerService', () => {
  let service: BrandAiAnalyzerService;
  let originalEnv: NodeJS.ProcessEnv;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    service = new BrandAiAnalyzerService();
    originalEnv = { ...process.env };
    originalFetch = global.fetch;
    process.env.GEMINI_API_KEY = 'test-api-key';
    process.env.GEMINI_MODEL = 'gemini-3.6-flash';
    mockGenerateContent.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  const sampleSnapshot: WebsiteSnapshot = {
    url: 'https://stripe.com',
    title: 'Stripe | Financial Infrastructure for the Internet',
    description: 'Millions of companies use Stripe to accept payments and grow.',
    headings: ['Financial Infrastructure for the Internet', 'Global Payments'],
    text: 'Stripe powers online and in-person payments for businesses around the world.',
    openGraph: { siteName: 'Stripe' },
    colors: ['#6366F1', '#38BDF8'],
    fonts: ['Söhne', 'Inter'],
    socialLinks: [{ platform: 'x', url: 'https://x.com/stripe' }],
    images: [{ url: 'https://stripe.com/hero.png' }],
    logo: 'https://stripe.com/logo.svg',
    favicon: 'https://stripe.com/favicon.ico',
    structuredData: [],
    extractedAt: new Date().toISOString(),
  };

  it('parses structured brand intelligence from Gemini SDK output with gemini-3.6-flash', async () => {
    const mockAiPayload = {
      brandName: 'Stripe',
      industry: 'Financial Technology',
      subIndustry: 'Payment Processing',
      description: 'Global financial infrastructure company.',
      products: [{ name: 'Stripe Payments', description: 'Accept online payments' }],
      services: [],
      targetAudience: [{ segment: 'Developers & Startups' }],
      brandVoice: {
        tone: ['direct', 'innovative', 'authoritative'],
        formality: 'high',
        humor: 'low',
        technicality: 'high',
        emotion: 'medium',
      },
    };

    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify(mockAiPayload),
    });

    const result = await service.analyze(sampleSnapshot);

    expect(result.brandName).toBe('Stripe');
    expect(result.industry).toBe('Financial Technology');
    expect(result.products.length).toBe(1);
    expect(result.primaryColor).toBe('#6366F1');
    expect(result.logoUrl).toBe('https://stripe.com/logo.svg');
    expect(result.websiteUrl).toBe('https://stripe.com');
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-3.6-flash',
      }),
    );
  });

  it('falls back to Gemini REST API when SDK throws a transient exception', async () => {
    mockGenerateContent.mockRejectedValue(new Error('SDK Connection Timeout'));

    const mockRestPayload = {
      brandName: 'Stripe',
      industry: 'FinTech',
      description: 'Payment platform.',
      products: [],
      services: [],
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(mockRestPayload) }],
              },
            },
          ],
        }),
    } as any);

    const result = await service.analyze(sampleSnapshot);

    expect(result.brandName).toBe('Stripe');
    expect(result.industry).toBe('FinTech');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',
      ),
      expect.any(Object),
    );
  });

  it('does NOT trigger REST fallback and throws immediately when SDK reports 404 / model not found', async () => {
    mockGenerateContent.mockRejectedValue(
      new Error(
        'models/gemini-1.5-flash is not found for API version v1beta, or is not supported for generateContent',
      ),
    );

    global.fetch = jest.fn();

    await expect(service.analyze(sampleSnapshot)).rejects.toThrow(
      BadRequestException,
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('throws BadRequestException cleanly without fabricating fake data when GEMINI_API_KEY is missing', async () => {
    delete process.env.GEMINI_API_KEY;

    await expect(service.analyze(sampleSnapshot)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException when REST fallback also returns 404', async () => {
    mockGenerateContent.mockRejectedValue(new Error('SDK Connection Timeout'));

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve('Model not found'),
    } as any);

    await expect(service.analyze(sampleSnapshot)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('auto-upgrades deprecated gemini-1.5-flash to gemini-3.6-flash', async () => {
    process.env.GEMINI_MODEL = 'gemini-1.5-flash';

    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({ brandName: 'Stripe', industry: 'FinTech' }),
    });

    const result = await service.analyze(sampleSnapshot);
    expect(result.brandName).toBe('Stripe');
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-3.6-flash',
      }),
    );
  });
});
