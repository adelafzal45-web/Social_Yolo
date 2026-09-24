import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandProfile } from '../brands/entities/brand-profile.entity';
import { BrandInsight } from '../brands/entities/brand-insight.entity';
import { BrandEmbedding } from './entities/brand-embedding.entity';
import { BrandIntelligenceService } from './brand-intelligence.service';
import { EmbeddingsService } from '../post-generator/rag/embeddings.service';

import { BrandIntelligenceController } from './brand-intelligence.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([BrandProfile, BrandInsight, BrandEmbedding]),
  ],
  controllers: [BrandIntelligenceController],
  providers: [BrandIntelligenceService, EmbeddingsService],
  exports: [BrandIntelligenceService, EmbeddingsService],
})
export class BrandIntelligenceModule {}
