import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DesignTemplate } from './entities/design-template.entity';
import { DesignTemplatesService } from './design-templates.service';

@Module({
  imports: [TypeOrmModule.forFeature([DesignTemplate])],
  providers: [DesignTemplatesService],
  exports: [DesignTemplatesService],
})
export class DesignTemplatesModule {}
