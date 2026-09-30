import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { databaseConfig } from './config/database.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ImageProcessingModule } from './image-processing/image-processing.module';
import { PostGeneratorModule } from './post-generator/post-generator.module';
import { PostsModule } from './posts/posts.module';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { BrandsModule } from './brands/brands.module';
import { BillingModule } from './billing/billing.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RedisCacheModule } from './common/cache/redis-cache.module';
import { StyleReferenceModule } from './style-references/style-reference.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    RedisCacheModule,
    UsersModule,
    AuthModule,
    BrandsModule,
    BillingModule,
    NotificationsModule,
    ImageProcessingModule,
    PostsModule,
    PostGeneratorModule,
    StyleReferenceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
