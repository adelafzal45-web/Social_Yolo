import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Brand,
  CreativeVariant,
  GenerationJob,
  Project,
} from '../database/entities';
import { CreditsModule } from '../credits/credits.module';
import { AIModule } from '../ai/ai.module';
import { GenerationService } from './generation.service';
import { GenerationController } from './generation.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([GenerationJob, Project, CreativeVariant, Brand]),
    CreditsModule,
    AIModule,
  ],
  controllers: [GenerationController],
  providers: [GenerationService],
  exports: [GenerationService],
})
export class GenerationModule {}
