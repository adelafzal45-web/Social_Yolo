import { Module } from '@nestjs/common';

import { ImageProcessingService } from './image-processing.service';
import { ImageProcessingController } from './image-processing.controller';

@Module({
  controllers: [ImageProcessingController],
  providers: [ImageProcessingService],
  exports: [ImageProcessingService],
})
export class ImageProcessingModule {}
