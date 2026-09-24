import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreativeVariant, Project, Brand } from '../database/entities';
import { CreativeGeneration } from '../creative-generation/entities/creative-generation.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { DesignProjectsController } from './design-projects.controller';
import { AuthModule } from '../auth/auth.module';
import { CreativeGenerationModule } from '../creative-generation/creative-generation.module';
import { DesignReferencesModule } from '../design-references/design-references.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      CreativeVariant,
      Brand,
      CreativeGeneration,
    ]),
    AuthModule,
    CreativeGenerationModule,
    DesignReferencesModule,
  ],
  controllers: [ProjectsController, DesignProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
