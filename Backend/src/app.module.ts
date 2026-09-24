import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { databaseConfig } from './config/database.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ImageProcessingModule } from './image-processing/image-processing.module';
import { PostGeneratorModule } from './post-generator/post-generator.module';
import { PostsModule } from './posts/posts.module';

import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { BrandsModule } from './brands/brands.module';
import { BillingModule } from './billing/billing.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RedisCacheModule } from './common/cache/redis-cache.module';
import { InspirationModule } from './inspiration/inspiration.module';
import { ContentModule } from './content/content.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { EmailModule } from './email/email.module';
import { ProjectsModule } from './projects/projects.module';
import { BrandIntelligenceModule } from './brand-intelligence/brand-intelligence.module';
import { DesignReferencesModule } from './design-references/design-references.module';
import { CreativeRAGModule } from './creative-rag/creative-rag.module';
import { DesignTemplatesModule } from './design-templates/design-templates.module';
import { CreativeGenerationModule } from './creative-generation/creative-generation.module';
import { CreativeExportModule } from './creative-export/creative-export.module';
import { DesignPlatformModule } from './design-platform/design-platform.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    RedisCacheModule,
    UsersModule,
    AdminModule,
    AuthModule,
    BrandsModule,
    BillingModule,
    NotificationsModule,
    ImageProcessingModule,
    PostsModule,
    PostGeneratorModule,
    InspirationModule,
    ContentModule,
    AnalyticsModule,
    EmailModule,
    ProjectsModule,
    BrandIntelligenceModule,
    DesignReferencesModule,
    CreativeRAGModule,
    DesignTemplatesModule,
    CreativeGenerationModule,
    CreativeExportModule,
    DesignPlatformModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
