import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreativeExport } from '../creative-generation/entities/creative-export.entity';
import { CreativeVariation } from '../creative-generation/entities/creative-variation.entity';
import { CreativeExportService } from './creative-export.service';
import { CreativeExportController } from './creative-export.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CreativeExport, CreativeVariation])],
  controllers: [CreativeExportController],
  providers: [CreativeExportService],
  exports: [CreativeExportService],
})
export class CreativeExportModule {}
