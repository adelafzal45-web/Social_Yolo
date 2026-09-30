import { Module } from '@nestjs/common';

import { ImageProcessingService } from './image-processing.service';
import { BackgroundRemovalQueueService } from './background-removal-queue.service';
import { ImageProcessingController } from './image-processing.controller';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ImageProcessingController],
  providers: [ImageProcessingService, BackgroundRemovalQueueService],
  exports: [ImageProcessingService, BackgroundRemovalQueueService],
})
export class ImageProcessingModule {}
