import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import {
  ProjectsService,
  CreateProjectDto,
  UpdateProjectDto,
} from './projects.service';
import { DesignReferencesService } from '../design-references/design-references.service';
import { ConceptGenerationService } from '../creative-generation/services/concept-generation.service';
import { CreativeGenerationEngineService } from '../creative-generation/creative-generation-engine.service';
import { CreativeGeneration } from '../creative-generation/entities/creative-generation.entity';

export class UpdateProjectBrandDto {
  brandId?: string;
  brandName?: string;
  brandColors?: string[];
  fontHeading?: string;
  fontBody?: string;
}

export class UpdateProjectContentDto {
  objective?: string;
  mainTopic?: string;
  keyInfo?: string;
  headline?: string;
  subheadline?: string;
  cta?: string;
  offer?: string;
  price?: string;
  date?: string;
}

export class ProjectInspirationSearchDto {
  query?: string;
  source?: string;
  style?: string;
  limit?: number;
}

export class GenerateProjectRunDto {
  designType?: 'creative' | 'meta_ad';
  platform?: string;
  style?: string;
  headline?: string;
  subheadline?: string;
  cta?: string;
  offer?: string;
  productName?: string;
}

@ApiTags('design-projects')
@Controller(['design-projects', 'v1/design-projects'])
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DesignProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly designReferencesService: DesignReferencesService,
    private readonly conceptGenerationService: ConceptGenerationService,
    private readonly creativeGenerationEngine: CreativeGenerationEngineService,
    @InjectRepository(CreativeGeneration)
    private readonly generationRepo: Repository<CreativeGeneration>,
  ) {}

  private resolveOrgId(user: AuthUser): string {
    return user?.organizationId || user?.id || 'd0cf85ae-ed2c-486a-889d-27dca93daa66';
  }

  @Get()
  @ApiOperation({ summary: 'List all design projects for current workspace' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'clientFolder', required: false })
  @ApiQuery({ name: 'brandId', required: false })
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('clientFolder') clientFolder?: string,
    @Query('brandId') brandId?: string,
  ) {
    const list = await this.projectsService.findAll(this.resolveOrgId(user), {
      status,
      clientFolder,
      brandId,
    });

    if (search) {
      const q = search.toLowerCase();
      return list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brandName.toLowerCase().includes(q) ||
          (p.style && p.style.toLowerCase().includes(q)),
      );
    }

    return list;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project with its full creative variants and history' })
  async findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.projectsService.findOne(this.resolveOrgId(user), id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new design studio project' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(this.resolveOrgId(user), dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update project settings, copy, or brand parameters (PUT)' })
  async updatePut(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(this.resolveOrgId(user), id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project settings, copy, or brand parameters (PATCH)' })
  async updatePatch(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(this.resolveOrgId(user), id, dto);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate an existing project and its generated variants' })
  async duplicate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.projectsService.duplicate(this.resolveOrgId(user), id);
  }

  @Post(':id/brand')
  @ApiOperation({ summary: 'Link or update brand configuration for a project' })
  async updateBrand(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateProjectBrandDto,
  ) {
    const orgId = this.resolveOrgId(user);
    const project = await this.projectsService.findOne(orgId, id);
    if (dto.brandId) project.brandId = dto.brandId;
    if (dto.brandName) project.brandName = dto.brandName;
    return this.projectsService.update(orgId, id, {
      brandId: project.brandId,
      brandName: project.brandName,
    });
  }

  @Post(':id/content')
  @ApiOperation({ summary: 'Update structured content parameters for a project' })
  async updateContent(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateProjectContentDto,
  ) {
    const orgId = this.resolveOrgId(user);
    const project = await this.projectsService.findOne(orgId, id);
    const existingCopy = project.copy || { headline: '', body: '', occasion: '' };
    const updatedCopy = {
      ...existingCopy,
      headline: dto.headline || existingCopy.headline,
      body: dto.keyInfo || dto.mainTopic || existingCopy.body,
      occasion: dto.objective || existingCopy.occasion,
      customNote: dto.offer || existingCopy.customNote,
    };
    return this.projectsService.update(orgId, id, {
      copy: updatedCopy,
    });
  }

  @Post(':id/inspiration/search')
  @ApiOperation({ summary: 'Search inspiration references tailored to this project' })
  async searchInspiration(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ProjectInspirationSearchDto,
  ) {
    const project = await this.projectsService.findOne(this.resolveOrgId(user), id);
    return this.designReferencesService.searchInspirations({
      query: dto.query || project.name || '',
      source: dto.source || 'all',
      style: dto.style || project.style,
      platform: project.platforms?.[0] || 'Instagram Post',
      designType: project.outputMode,
      limit: dto.limit || 20,
    });
  }

  @Post(':id/concepts')
  @ApiOperation({ summary: 'Synthesize 3-4 creative design concepts for this project' })
  async generateConcepts(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto?: { customTopic?: string; style?: string },
  ) {
    const project = await this.projectsService.findOne(this.resolveOrgId(user), id);
    const concepts = await this.conceptGenerationService.generateConcepts({
      brandName: project.brandName,
      style: dto?.style || project.style,
      platform: project.platforms?.[0] || 'Instagram Post',
      objective: project.copy?.occasion,
      mainTopic: dto?.customTopic || project.copy?.body,
    });
    return {
      projectId: id,
      count: concepts.length,
      concepts,
    };
  }

  @Post(':id/generate')
  @ApiOperation({ summary: 'Trigger 10-stage AI generation run linked to this project' })
  async generateCreative(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: GenerateProjectRunDto,
  ) {
    const orgId = this.resolveOrgId(user);
    const project = await this.projectsService.findOne(orgId, id);

    const job = await this.creativeGenerationEngine.startGeneration({
      projectId: project.id,
      brandId: project.brandId,
      userId: user?.id,
      projectName: project.name,
      designType: dto.designType || (project.outputMode as any) || 'creative',
      objective: project.copy?.occasion || 'Promote Product',
      style: dto.style || project.style || 'Premium',
      platform: dto.platform || project.platforms?.[0] || 'Instagram Post',
      headline: dto.headline || project.copy?.headline,
      subheadline: dto.subheadline || project.copy?.body,
      cta: dto.cta || 'Shop Now',
      offer: dto.offer || project.copy?.customNote,
      productName: dto.productName,
    });

    await this.projectsService.update(orgId, id, { status: 'generating' });

    return {
      id: job.id,
      jobId: job.id,
      projectId: id,
      status: job.status,
      progressPct: job.progressPct,
      currentStageLabel: job.currentStageLabel,
      message: 'Design studio generation pipeline initialized for project.',
    };
  }

  @Get(':id/generations')
  @ApiOperation({ summary: 'List all generation runs and creative variations for this project' })
  async getGenerations(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    await this.projectsService.findOne(this.resolveOrgId(user), id);

    const generations = await this.generationRepo.find({
      where: { projectId: id },
      relations: ['variations', 'exports'],
      order: { createdAt: 'DESC' },
    });

    return generations;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archive / delete a project' })
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.projectsService.remove(this.resolveOrgId(user), id);
  }
}
