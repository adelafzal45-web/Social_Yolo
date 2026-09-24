import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreativeGeneration } from './entities/creative-generation.entity';
import { CreativeVariation } from './entities/creative-variation.entity';
import { CreativeExport } from './entities/creative-export.entity';
import { CreativeGenerationEngineService } from './creative-generation-engine.service';
import { DeterministicRendererService } from './deterministic-renderer.service';
import { DesignQualityControlService } from './design-quality-control.service';
import { MetaDesignEngineService } from './meta-design-engine.service';
import { CreativeGenerationController } from './creative-generation.controller';
import { DesignGenerationsController } from './design-generations.controller';
import { BrandIntelligenceModule } from '../brand-intelligence/brand-intelligence.module';
import { CreativeRAGModule } from '../creative-rag/creative-rag.module';
import { DesignReferencesModule } from '../design-references/design-references.module';
import { CreditsModule } from '../credits/credits.module';
import { GeminiService } from '../post-generator/gemini.service';
import { PollinationsService } from '../post-generator/providers/pollinations.service';
import { StructuredDesignService } from './services/structured-design.service';
import { ConceptGenerationService } from './services/concept-generation.service';
import { DesignValidationService } from './services/design-validation.service';
import { PlatformAdaptationService } from './services/platform-adaptation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CreativeGeneration,
      CreativeVariation,
      CreativeExport,
    ]),
    BrandIntelligenceModule,
    CreativeRAGModule,
    DesignReferencesModule,
    CreditsModule,
  ],
  controllers: [
    CreativeGenerationController,
    DesignGenerationsController,
  ],
  providers: [
    CreativeGenerationEngineService,
    DeterministicRendererService,
    DesignQualityControlService,
    MetaDesignEngineService,
    GeminiService,
    PollinationsService,
    StructuredDesignService,
    ConceptGenerationService,
    DesignValidationService,
    PlatformAdaptationService,
  ],
  exports: [
    CreativeGenerationEngineService,
    DeterministicRendererService,
    StructuredDesignService,
    ConceptGenerationService,
    DesignValidationService,
    PlatformAdaptationService,
  ],
})
export class CreativeGenerationModule {}
