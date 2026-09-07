import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ImageProcessingModule } from './image-processing/image-processing.module';

@Module({
  imports: [ImageProcessingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
