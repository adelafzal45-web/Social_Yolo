import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreativeVariant, Project, Brand } from '../database/entities';

import { PartialType } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  brandId?: string;

  @IsString()
  @IsOptional()
  brandName?: string;

  @IsString()
  @IsOptional()
  clientFolder?: string;

  @IsString()
  @IsOptional()
  status?: 'draft' | 'generating' | 'review' | 'approved';

  @IsString()
  @IsOptional()
  outputMode?: 'creative' | 'meta_ad';

  @IsArray()
  @IsOptional()
  platforms?: string[];

  @IsString()
  @IsOptional()
  style?: string;

  @IsString()
  @IsOptional()
  contentType?: 'static' | 'video';

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  originalPhotoUrl?: string;

  @IsString()
  @IsOptional()
  enhancedPhotoUrl?: string;

  @IsString()
  @IsOptional()
  transparentPhotoUrl?: string;

  @IsString()
  @IsOptional()
  backgroundMode?: 'keep' | 'remove' | 'ai_replace';

  @IsString()
  @IsOptional()
  backgroundPreset?: string;

  @IsOptional()
  copy?: {
    headline: string;
    body: string;
    occasion: string;
    customNote?: string;
  };

  @IsNumber()
  @IsOptional()
  creditsUsed?: number;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class UpdateCreativeVariantDto {
  @IsString()
  @IsOptional()
  headline?: string;

  @IsString()
  @IsOptional()
  body?: string;

  @IsString()
  @IsOptional()
  ctaText?: string;

  @IsString()
  @IsOptional()
  style?: string;

  @IsString()
  @IsOptional()
  status?: 'approved' | 'needs_review' | 'rejected';

  @IsString()
  @IsOptional()
  renderUrl?: string;

  @IsOptional()
  metaPass?: boolean;

  @IsNumber()
  @IsOptional()
  textCoveragePct?: number;
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(CreativeVariant)
    private readonly creativeRepo: Repository<CreativeVariant>,
    @InjectRepository(Brand)
    private readonly brandRepo: Repository<Brand>,
  ) {}

  async findAll(
    organizationId: string,
    filters?: { status?: string; clientFolder?: string; brandId?: string },
  ): Promise<Project[]> {
    const query = this.projectRepo
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.creatives', 'creative')
      .where('project.organizationId = :organizationId', { organizationId })
      .orderBy('project.createdAt', 'DESC');

    if (filters?.status) {
      query.andWhere('project.status = :status', { status: filters.status });
    }
    if (filters?.clientFolder) {
      query.andWhere('project.clientFolder = :clientFolder', {
        clientFolder: filters.clientFolder,
      });
    }
    if (filters?.brandId) {
      query.andWhere('project.brandId = :brandId', {
        brandId: filters.brandId,
      });
    }

    return query.getMany();
  }

  async findOne(organizationId: string, id: string): Promise<Project> {
    const project = await this.projectRepo.findOne({
      where: { id, organizationId },
      relations: { creatives: true },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found.`);
    }

    return project;
  }

  async create(
    organizationId: string,
    dto: CreateProjectDto,
  ): Promise<Project> {
    let brandName = dto.brandName;
    let brandId = dto.brandId;

    if (!brandId) {
      const defaultBrand = await this.brandRepo.findOne({
        where: { organizationId },
      });
      if (defaultBrand) {
        brandId = defaultBrand.id;
        brandName = defaultBrand.name;
      } else {
        brandId = '00000000-0000-0000-0000-000000000000';
        brandName = 'Default Brand';
      }
    }

    const project = this.projectRepo.create({
      organizationId,
      brandId,
      brandName: brandName || 'Brightpath Client',
      clientFolder: dto.clientFolder || 'No folder',
      name: dto.name || 'Untitled Project',
      status: dto.status || 'draft',
      outputMode: dto.outputMode || 'creative',
      platforms: dto.platforms || [
        'instagram_portrait',
        'facebook_feed',
        'pinterest_pin',
        'twitter_feed',
      ],
      style: dto.style || 'lifestyle',
      contentType: dto.contentType || 'static',
      quantity: dto.quantity || 4,
      originalPhotoUrl: dto.originalPhotoUrl || '',
      enhancedPhotoUrl: dto.enhancedPhotoUrl,
      transparentPhotoUrl: dto.transparentPhotoUrl,
      backgroundMode: dto.backgroundMode || 'ai_replace',
      backgroundPreset: dto.backgroundPreset || 'Warm Studio',
      copy: dto.copy || {
        headline: 'Small batch. Big morning.',
        body: 'Roasted in 12kg batches, every Tuesday.',
        occasion: 'Limited edition',
      },
      creditsUsed: dto.creditsUsed || 0,
    });

    return this.projectRepo.save(project);
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.findOne(organizationId, id);

    if (dto.name !== undefined) project.name = dto.name;
    if (dto.brandId !== undefined) project.brandId = dto.brandId;
    if (dto.brandName !== undefined) project.brandName = dto.brandName;
    if (dto.clientFolder !== undefined) project.clientFolder = dto.clientFolder;
    if (dto.status !== undefined) project.status = dto.status;
    if (dto.outputMode !== undefined) project.outputMode = dto.outputMode;
    if (dto.platforms !== undefined) project.platforms = dto.platforms;
    if (dto.style !== undefined) project.style = dto.style;
    if (dto.contentType !== undefined) project.contentType = dto.contentType;
    if (dto.quantity !== undefined) project.quantity = dto.quantity;
    if (dto.originalPhotoUrl !== undefined)
      project.originalPhotoUrl = dto.originalPhotoUrl;
    if (dto.enhancedPhotoUrl !== undefined)
      project.enhancedPhotoUrl = dto.enhancedPhotoUrl;
    if (dto.transparentPhotoUrl !== undefined)
      project.transparentPhotoUrl = dto.transparentPhotoUrl;
    if (dto.backgroundMode !== undefined)
      project.backgroundMode = dto.backgroundMode;
    if (dto.backgroundPreset !== undefined)
      project.backgroundPreset = dto.backgroundPreset;
    if (dto.copy !== undefined) project.copy = { ...project.copy, ...dto.copy };
    if (dto.creditsUsed !== undefined) project.creditsUsed = dto.creditsUsed;

    await this.projectRepo.save(project);
    return this.findOne(organizationId, id);
  }

  async duplicate(organizationId: string, id: string): Promise<Project> {
    const source = await this.findOne(organizationId, id);

    const cloned = this.projectRepo.create({
      organizationId,
      brandId: source.brandId,
      brandName: source.brandName,
      clientFolder: source.clientFolder,
      name: `${source.name} (Copy)`,
      status: 'draft',
      outputMode: source.outputMode,
      platforms: [...source.platforms],
      style: source.style,
      contentType: source.contentType,
      quantity: source.quantity,
      originalPhotoUrl: source.originalPhotoUrl,
      enhancedPhotoUrl: source.enhancedPhotoUrl,
      transparentPhotoUrl: source.transparentPhotoUrl,
      backgroundMode: source.backgroundMode,
      backgroundPreset: source.backgroundPreset,
      copy: { ...source.copy },
      creditsUsed: 0,
    });

    const saved = await this.projectRepo.save(cloned);

    if (source.creatives && source.creatives.length > 0) {
      for (const variant of source.creatives) {
        const clonedVariant = this.creativeRepo.create({
          projectId: saved.id,
          platformKey: variant.platformKey,
          platformName: variant.platformName,
          width: variant.width,
          height: variant.height,
          label: variant.label,
          style: variant.style,
          headline: variant.headline,
          body: variant.body,
          ctaText: variant.ctaText,
          textCoveragePct: variant.textCoveragePct,
          metaPass: variant.metaPass,
          status: variant.status,
          renderUrl: variant.renderUrl,
          storageKey: variant.storageKey,
        });
        await this.creativeRepo.save(clonedVariant);
      }
    }

    return this.findOne(organizationId, saved.id);
  }

  async remove(
    organizationId: string,
    id: string,
  ): Promise<{ deleted: boolean }> {
    const project = await this.findOne(organizationId, id);
    await this.projectRepo.remove(project);
    return { deleted: true };
  }

  async updateCreativeVariant(
    organizationId: string,
    creativeId: string,
    dto: UpdateCreativeVariantDto,
  ): Promise<CreativeVariant> {
    const variant = await this.creativeRepo
      .createQueryBuilder('variant')
      .innerJoin('variant.project', 'project')
      .where('variant.id = :creativeId', { creativeId })
      .andWhere('project.organizationId = :organizationId', { organizationId })
      .getOne();

    if (!variant) {
      throw new NotFoundException(`Creative variant ${creativeId} not found.`);
    }

    if (dto.headline !== undefined) variant.headline = dto.headline;
    if (dto.body !== undefined) variant.body = dto.body;
    if (dto.ctaText !== undefined) variant.ctaText = dto.ctaText;
    if (dto.style !== undefined) variant.style = dto.style;
    if (dto.status !== undefined) variant.status = dto.status;
    if (dto.renderUrl !== undefined) variant.renderUrl = dto.renderUrl;
    if (dto.metaPass !== undefined) variant.metaPass = dto.metaPass;
    if (dto.textCoveragePct !== undefined)
      variant.textCoveragePct = dto.textCoveragePct;

    return this.creativeRepo.save(variant);
  }
}
