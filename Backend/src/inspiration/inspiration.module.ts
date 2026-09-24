import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspirationItem } from './entities/inspiration-item.entity';
import { InspirationAnalysis } from './entities/inspiration-analysis.entity';
import { InspirationCollection } from './entities/inspiration-collection.entity';
import { InspirationService } from './inspiration.service';
import { InspirationController } from './inspiration.controller';
import { PexelsProvider } from './providers/pexels.provider';
import { UnsplashProvider } from './providers/unsplash.provider';
import { PinterestProvider } from './providers/pinterest.provider';
import { BehanceProvider } from './providers/behance.provider';
import { DribbbleProvider } from './providers/dribbble.provider';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InspirationItem,
      InspirationAnalysis,
      InspirationCollection,
    ]),
    AuthModule,
    UsersModule,
  ],
  controllers: [InspirationController],
  providers: [
    InspirationService,
    PexelsProvider,
    UnsplashProvider,
    PinterestProvider,
    BehanceProvider,
    DribbbleProvider,
  ],
  exports: [InspirationService],
})
export class InspirationModule {}
