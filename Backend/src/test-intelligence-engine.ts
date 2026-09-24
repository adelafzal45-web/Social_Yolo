import './config/env';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BrandsService } from './brands/brands.service';
import { ContentService } from './content/content.service';
import { ContentConceptsService } from './content/content-concepts.service';
import { AnalyticsService } from './analytics/analytics.service';
import { AiContextBuilderService } from './ai/ai-context-builder.service';
import { UsersService } from './users/users.service';

import { DataSource } from 'typeorm';
import { User } from './users/entities/user.entity';

async function testIntelligenceEngine() {
  console.log('--- Initializing Nest Application Context ---');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const brandsService = app.get(BrandsService);
    const contentService = app.get(ContentService);
    const conceptsService = app.get(ContentConceptsService);
    const analyticsService = app.get(AnalyticsService);
    const contextBuilder = app.get(AiContextBuilderService);
    const dataSource = app.get(DataSource);
    const userRepo = dataSource.getRepository(User);

    // 1. Resolve or find/create test user
    let user = await userRepo.findOne({ where: {} });
    if (!user) {
      user = userRepo.create({
        email: 'admin@socialyolo.com',
        name: 'Admin User',
      });
      user = await userRepo.save(user);
    }
    const userId = user.id;
    console.log('✓ Resolved User ID:', userId, `(${user.email})`);

    // 2. Create or find test brand
    console.log('\n--- 1. Testing Brand Creation & DNA Storage ---');
    const brand = await brandsService.createBrand(userId, {
      name: 'Aura Minimalist Living',
      brandName: 'Aura Minimalist Living',
      tagline: 'Elevating daily rituals through architectural decor',
      websiteUrl: 'https://auraliving.co',
      industry: 'Home & Living',
      subIndustry: 'Sustainable Ceramic Decor',
      country: 'United States',
      city: 'Portland',
      description: 'Handcrafted ceramic objects and ambient lighting designed for intentional spaces.',
      primaryColor: '#2b2a27',
      secondaryColor: '#d6cdb7',
      accentColor: '#938274',
      secondaryColors: ['#f4f1ea', '#d6cdb7'],
      tone: 'Warm, refined and architectural',
      fontHeading: 'Canela',
      fontBody: 'Inter',
      brandVoice: {
        tone: ['Serene', 'Tactile', 'Architectural'],
        formality: 'Refined',
        humor: 'Subtle',
        technicality: 'Artisanal',
        emotion: 'Calm',
      },
      insights: {
        valueProposition: 'Timeless sculptural objects handcrafted in small batches using non-toxic stoneware.',
        products: [
          {
            name: 'The Dune Ceramic Vessel',
            description: 'Fluted terracotta centerpiece for botanical stems',
            category: 'Vessels',
          },
          {
            name: 'Alabaster Column Lamp',
            description: 'Solid stone diffused ambient light with brass touch dimmer',
            category: 'Lighting',
          },
        ],
        targetAudience: [
          {
            segment: 'Design Enthusiasts',
            description: 'Discerning homeowners and architects who appreciate tactile minimalism',
          },
        ],
      },
    } as any);

    console.log('✓ Brand created successfully. Brand ID:', brand.id);
    console.log('  Name:', brand.name || brand.brandName);
    console.log('  Primary Color:', brand.primaryColor);

    // 3. Test Full Brand Retrieval & Field Sources
    console.log('\n--- 2. Testing Full Brand Retrieval & Insights ---');
    const fullBrand = await brandsService.getFullBrand(userId, brand.id);
    console.log('✓ Retrieved full brand:');
    console.log('  Value Proposition:', fullBrand.insight?.valueProposition);
    console.log('  Products Count:', fullBrand.insight?.products?.length || 0);

    // 4. Test Multi-layer Context Assembly (Strict Precedence)
    console.log('\n--- 3. Testing Context Builder & Precedence Rules ---');
    const assembledContext = contextBuilder.buildContext(
      brand,
      fullBrand.insight || null,
      {
        brandId: brand.id,
        platform: 'instagram',
        contentType: 'Carousel',
        goal: 'Engagement',
        productName: 'The Dune Ceramic Vessel',
        language: 'English',
        variationsCount: 3,
      },
      { aesthetic: 'Warm architectural Brutalism', lighting: 'Afternoon sunbeams' },
      ['Multi-slide carousels retain 35% higher save rate']
    );

    console.log('✓ Context assembled cleanly without user prompt:');
    console.log('  Target Audience:', assembledContext.targetAudience);
    console.log('  Featured Product:', assembledContext.productDetails?.name);
    console.log('  Platform Strategy:', assembledContext.platformStrategy.name);
    console.log('  Recommended Aspect Ratio:', assembledContext.platformStrategy.recommendedAspectRatios[0]);

    // 5. Test Autonomous Concepts Generation (Spec Section 28)
    console.log('\n--- 4. Testing Autonomous Concept Generation ---');
    const concepts = await conceptsService.generateConcepts(userId, brand.id);
    console.log(`✓ Generated ${concepts.length} strategic concepts:`);
    concepts.forEach((c, idx) => {
      console.log(`  [Concept ${idx + 1}] "${c.title}"`);
      console.log(`    Hook: "${c.hook}"`);
      console.log(`    Angle: ${c.angle}`);
    });

    // 6. Test Structured Content Generation (Spec Section 16 & 17 — No Prompts)
    console.log('\n--- 5. Testing Structured Content Generation (No Prompt Input) ---');
    const contentResult = await contentService.generateContent(userId, {
      brandId: brand.id,
      platform: 'instagram',
      contentType: 'Carousel',
      goal: 'Engagement',
      productName: 'The Dune Ceramic Vessel',
      topic: 'The tactile beauty of raw stoneware',
      variationsCount: 2,
    });

    console.log(`✓ Content generated: ${contentResult.posts.length} posts created.`);
    contentResult.posts.forEach((p, idx) => {
      console.log(`  [Post ${idx + 1}] Title: ${p.title}`);
      console.log(`    Hook: "${p.headline}"`);
      console.log(`    Caption preview: ${p.caption?.substring(0, 100)}...`);
      console.log(`    Hashtags: ${p.hashtags?.join(', ')}`);
    });

    // 7. Test Analytics, Metrics & Performance Feedback Loop (Spec Section 31)
    if (contentResult.posts.length > 0) {
      console.log('\n--- 6. Testing Analytics & Feedback Loop ---');
      const testPost = contentResult.posts[0];
      const recordedMetric = await analyticsService.recordMetrics(testPost.id, {
        impressions: 4850,
        reach: 4120,
        likes: 312,
        comments: 48,
        shares: 62,
        saves: 95,
        clicks: 140,
      });

      console.log('✓ Recorded post metrics:');
      console.log('  Impressions:', recordedMetric.impressions);
      console.log('  Calculated Engagement Rate:', recordedMetric.engagementRate + '%');
      console.log('  Calculated CTR:', recordedMetric.ctr + '%');

      const overview = await analyticsService.getBrandOverview(brand.id);
      console.log('✓ Brand Analytics Overview:');
      console.log('  Total Posts Tracked:', overview.totalPosts);
      console.log('  Total Impressions:', overview.totalImpressions);
      console.log('  Avg Engagement Rate:', overview.avgEngagementRate + '%');

      const generatedInsights = await analyticsService.generateInsightsForBrand(brand.id);
      console.log(`✓ Generated ${generatedInsights.length} actionable learning insights:`);
      generatedInsights.forEach((ins) => {
        console.log(`  * [${ins.patternType}] ${ins.insight}`);
      });
    }

    console.log('\n========================================');
    console.log('🎉 ALL INTELLIGENCE ENGINE TESTS PASSED!');
    console.log('========================================\n');
  } catch (err) {
    console.error('Test execution failed:', err);
    throw err;
  } finally {
    await app.close();
  }
}

testIntelligenceEngine().catch((e) => {
  console.error(e);
  process.exit(1);
});
