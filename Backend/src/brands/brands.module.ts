import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandProfile } from './entities/brand-profile.entity';
import { BrandInsight } from './entities/brand-insight.entity';
import { BrandSource } from './entities/brand-source.entity';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

import { UrlValidator } from './crawler/url-validator';
import { CheerioExtractor } from './crawler/cheerio-extractor';
import { HttpWebsiteCrawler } from './crawler/http-website-crawler.service';
import { BrowserWebsiteCrawler } from './crawler/browser-website-crawler.service';
import { BrandAiAnalyzerService } from './ai/brand-ai-analyzer.service';
import { WebsiteAnalyzerService } from './website-analyzer.service';
import { BrandAnalysisProcessor } from './brand-analysis.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([BrandProfile, BrandInsight, BrandSource]),
    AuthModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [BrandsController],
  providers: [
    BrandsService,
    UrlValidator,
    CheerioExtractor,
    HttpWebsiteCrawler,
    BrowserWebsiteCrawler,
    BrandAiAnalyzerService,
    WebsiteAnalyzerService,
    BrandAnalysisProcessor,
  ],
  exports: [
    BrandsService,
    UrlValidator,
    CheerioExtractor,
    HttpWebsiteCrawler,
    BrowserWebsiteCrawler,
    BrandAiAnalyzerService,
    WebsiteAnalyzerService,
    BrandAnalysisProcessor,
  ],
})
export class BrandsModule {}
