import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { databaseConfig } from './config/database.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ImageProcessingModule } from './image-processing/image-processing.module';
import { PostGeneratorModule } from './post-generator/post-generator.module';
import { PostsModule } from './posts/posts.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    ImageProcessingModule,
    PostsModule,
    PostGeneratorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
