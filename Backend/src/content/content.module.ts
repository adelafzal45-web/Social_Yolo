import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../posts/entities/post.entity';
import { ContentConcept } from './entities/content-concept.entity';
import { AiGeneration } from './entities/ai-generation.entity';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { ContentConceptsService } from './content-concepts.service';
import { ContentConceptsController } from './content-concepts.controller';
import { PlatformStrategyService } from '../ai/platform-strategy.service';
import { AiContextBuilderService } from '../ai/ai-context-builder.service';
import { BrandsModule } from '../brands/brands.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, ContentConcept, AiGeneration]),
    BrandsModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [ContentController, ContentConceptsController],
  providers: [
    ContentService,
    ContentConceptsService,
    PlatformStrategyService,
    AiContextBuilderService,
  ],
  exports: [
    ContentService,
    ContentConceptsService,
    PlatformStrategyService,
    AiContextBuilderService,
  ],
})
export class ContentModule {}
