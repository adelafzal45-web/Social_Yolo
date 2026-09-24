import { ReferenceRerankingService } from './reference-reranking.service';
import { DesignPatternExtractionService } from './design-pattern-extraction.service';
import { OriginalityEngineService } from './originality-engine.service';
import { DesignQualityControlService } from '../creative-generation/design-quality-control.service';
import { MetaDesignEngineService } from '../creative-generation/meta-design-engine.service';

describe('AI Creative Intelligence & RAG Suite', () => {
  let rerankingService: ReferenceRerankingService;
  let patternExtractor: DesignPatternExtractionService;
  let originalityEngine: OriginalityEngineService;
  let qualityControl: DesignQualityControlService;
  let metaEngine: MetaDesignEngineService;

  beforeEach(() => {
    rerankingService = new ReferenceRerankingService();
    patternExtractor = new DesignPatternExtractionService();
    originalityEngine = new OriginalityEngineService();
    qualityControl = new DesignQualityControlService();
    metaEngine = new MetaDesignEngineService();
  });

  describe('ReferenceRerankingService (Section 8)', () => {
    it('should correctly apply weighted multi-factor ranking formula', () => {
      const candidates = [
        {
          reference: {
            id: 'ref-1',
            title: 'Nordic Minimal',
            platform: 'Instagram Post',
            industry: 'Home & Decor',
            style: 'Minimal',
            qualityScore: 95,
            colorPalette: ['#2b2a27', '#d6cdb7'],
          } as any,
          semanticSimilarity: 0.85,
          visualSimilarity: 0.8,
          combinedSimilarity: 0.83,
        },
        {
          reference: {
            id: 'ref-2',
            title: 'Bold Sport',
            platform: 'Twitter',
            industry: 'Automotive',
            style: 'Bold',
            qualityScore: 80,
            colorPalette: ['#000000', '#ff0000'],
          } as any,
          semanticSimilarity: 0.4,
          visualSimilarity: 0.3,
          combinedSimilarity: 0.36,
        },
      ];

      const ranked = rerankingService.rerank(
        candidates,
        {
          platform: 'Instagram Post',
          industry: 'Home & Decor',
          style: 'Minimal',
          designType: 'Product Promotion',
          objective: 'Promote Product',
          brandColors: ['#2b2a27'],
        },
        2,
      );

      expect(ranked).toHaveLength(2);
      expect(ranked[0].scoredRef.reference.id).toBe('ref-1');
      expect(ranked[0].finalScore).toBeGreaterThan(ranked[1].finalScore);
      expect(ranked[0].finalScore).toBeGreaterThan(0.8);
    });
  });

  describe('DesignPatternExtractionService & OriginalityEngine (Section 3, 7 & 20)', () => {
    it('should extract structured patterns and synthesize original non-copied creative strategy', () => {
      const mockRanked = [
        {
          scoredRef: {
            reference: {
              id: 'ref-1',
              title: 'Luxury Editorial',
              composition: { layout: 'centered pedestal', focalPoint: 'product', textPlacement: 'top', ctaPlacement: 'bottom', whitespacePercentage: 40, grid: 'centered' },
              typography: { hierarchy: 'high contrast serif', weight: 'bold', bodyDensity: 'low', fontClassification: 'serif' },
              colorPalette: ['#0a0a0a', '#d4af37'],
              visualElements: ['ambient gold rim', 'soft shadows'],
              qualityScore: 96,
            } as any,
            combinedSimilarity: 0.9,
            semanticSimilarity: 0.9,
            visualSimilarity: 0.9,
          },
          finalScore: 0.92,
          scoreBreakdown: {} as any,
        },
      ];

      const patterns = patternExtractor.extractPatterns(mockRanked as any);
      expect(patterns).toHaveLength(1);
      expect(patterns[0].composition.layout).toBe('centered pedestal');

      const strategy = originalityEngine.synthesizeOriginalStrategy(
        patterns,
        {
          brandId: 'brand-1',
          brandName: 'Aura Living',
          industry: 'Ceramics',
          visualIdentity: {
            primaryColor: '#2b2a27',
            secondaryColor: '#d6cdb7',
            accentColor: '#938274',
            palette: ['#2b2a27', '#d6cdb7'],
            fontHeading: 'Canela',
            fontBody: 'Inter',
            logoUrl: null,
            faviconUrl: null,
          },
          personality: { tone: 'Architectural', brandVoice: {}, moodAdjectives: ['Serene'] },
          audience: { segments: [], valueProposition: 'Timeless', painPoints: [], benefits: [] },
          products: [],
          services: [],
          tagline: null,
          websiteUrl: null,
          description: null,
          subIndustry: null,
        },
        {
          platform: 'Instagram Post',
          designType: 'creative',
          style: 'Minimal',
          objective: 'Promote Product',
          compositionPreference: 'Product Focus',
        },
      );

      expect(strategy.originalityProof.isOriginalComposition).toBe(true);
      expect(strategy.typographyPairing.headingFont).toBe('Canela');
      expect(strategy.colorStrategy.ctaButtonHex).toBe('#2b2a27');
    });
  });

  describe('DesignQualityControlService (Section 23)', () => {
    it('should validate QA parameters and auto-improve if needed', () => {
      const qa = qualityControl.validateAndImprove({
        width: 1080,
        height: 1350,
        headline: 'This is an exceedingly long headline designed to test whether the quality control auto-improver safely trims verbose text for mobile users',
        ctaText: '',
        brandPrimaryColor: '#7c5cff',
        brandAccentColor: '#e0aa4e',
        textCoveragePct: 14,
        platform: 'Instagram Post',
      });

      expect(qa.result.passed).toBe(true);
      expect(qa.result.overallScore).toBeGreaterThanOrEqual(85);
      expect(qa.improvedParams.ctaText).toBe('SHOP NOW');
      expect(qa.improvedParams.headline.endsWith('...')).toBe(true);
      expect(qa.result.autoImprovementsApplied.length).toBeGreaterThan(0);
    });
  });

  describe('MetaDesignEngineService (Section 24)', () => {
    it('should enforce Meta advertisement specs and text limits', () => {
      const metaFeed = metaEngine.optimizeForMetaAd('facebook_feed', {
        headline: 'Huge Summer Clearance With Massive 50% Off Sitewide This Weekend Only',
        subheadline: 'Shop hundreds of styles while supplies last. Free shipping on all orders.',
        brandName: 'Nike',
      });

      expect(metaFeed.headline.length).toBeLessThanOrEqual(50);
      expect(metaFeed.cta).toBe('ORDER NOW');
      expect(metaFeed.spec.aspectRatio).toBe('1.91:1');
    });
  });
});
