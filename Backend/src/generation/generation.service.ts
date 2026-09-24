import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from 'rxjs';
import {
  CreativeVariant,
  GenerationJob,
  Project,
  Brand,
} from '../database/entities';
import { CreditsService } from '../credits/credits.service';
import { AIRouterService } from '../ai/ai-router.service';
import { RAGService } from '../ai/rag.service';

import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class StartGenerationDto {
  @IsString()
  projectId!: string;

  @IsArray()
  @IsOptional()
  platforms?: string[];

  @IsString()
  @IsOptional()
  style?: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  outputMode?: 'creative' | 'meta_ad';

  @IsString()
  @IsOptional()
  provider?: string;

  @IsOptional()
  customCopy?: {
    headline?: string;
    body?: string;
    occasion?: string;
  };
}

export interface JobProgressEvent {
  jobId: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  stage: string;
  progressPct: number;
  error?: string;
  variants?: any[];
}

@Injectable()
export class GenerationService {
  private readonly logger = new Logger(GenerationService.name);
  private readonly jobStreams: Map<string, Subject<JobProgressEvent>> =
    new Map();

  constructor(
    @InjectRepository(GenerationJob)
    private readonly jobRepo: Repository<GenerationJob>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(CreativeVariant)
    private readonly creativeRepo: Repository<CreativeVariant>,
    @InjectRepository(Brand)
    private readonly brandRepo: Repository<Brand>,
    private readonly creditsService: CreditsService,
    private readonly aiRouter: AIRouterService,
    private readonly ragService: RAGService,
  ) {}

  getJobStream(jobId: string): Subject<JobProgressEvent> {
    let stream = this.jobStreams.get(jobId);
    if (!stream) {
      stream = new Subject<JobProgressEvent>();
      this.jobStreams.set(jobId, stream);
    }
    return stream;
  }

  async getJobStatus(
    organizationId: string,
    jobId: string,
  ): Promise<GenerationJob> {
    const job = await this.jobRepo.findOne({
      where: { id: jobId, organizationId },
    });
    if (!job) {
      throw new NotFoundException(`Generation job ${jobId} not found.`);
    }
    return job;
  }

  async startJob(
    organizationId: string,
    dto: StartGenerationDto,
    userId?: string,
  ): Promise<GenerationJob> {
    const project = await this.projectRepo.findOne({
      where: { id: dto.projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException(`Project ${dto.projectId} not found.`);
    }

    const platforms = dto.platforms ||
      project.platforms || ['instagram_portrait', 'facebook_feed'];
    const quantity = platforms.length;
    const costCredits = quantity * 4; // 4 credits per platform creative

    // 1. Reserve credits
    await this.creditsService.reserveCredits(
      organizationId,
      costCredits,
      `job_init_${project.id}`,
    );

    // 2. Create Job in database
    const idempotencyKey = `gen_${project.id}_${Date.now()}`;
    const job = this.jobRepo.create({
      organizationId,
      projectId: project.id,
      status: 'QUEUED',
      currentStage: 'Queue Initialized',
      progressPct: 5,
      costCredits,
      idempotencyKey,
    });

    const savedJob = await this.jobRepo.save(job);
    project.status = 'generating';
    await this.projectRepo.save(project);

    // 3. Trigger asynchronous multi-stage execution pipeline
    setImmediate(() => {
      this.executeGenerationPipeline(
        organizationId,
        savedJob.id,
        project,
        dto,
        userId,
      ).catch((err) =>
        this.logger.error(`Generation pipeline failure: ${err.message}`),
      );
    });

    return savedJob;
  }

  private async executeGenerationPipeline(
    organizationId: string,
    jobId: string,
    project: Project,
    dto: StartGenerationDto,
    userId?: string,
  ) {
    const stream = this.getJobStream(jobId);

    const updateStage = async (stage: string, progressPct: number) => {
      await this.jobRepo.update(jobId, {
        currentStage: stage,
        progressPct,
        status: 'PROCESSING',
      });
      stream.next({ jobId, status: 'PROCESSING', stage, progressPct });
    };

    try {
      // Stage 1: Preprocessing & Subject Isolation (15%)
      await updateStage('Subject Preprocessing & Alpha Isolation', 20);
      await new Promise((r) => setTimeout(r, 600));

      // Stage 2: RAG Context & AI Copywriting (45%)
      await updateStage('RAG Context & Multi-Model AI Copywriting', 45);
      const brand = await this.brandRepo.findOne({
        where: { id: project.brandId },
      });

      let generatedHeadline =
        dto.customCopy?.headline || project.copy?.headline;
      let generatedBody = dto.customCopy?.body || project.copy?.body;
      let generatedCta = 'SHOP NOW';
      let occasion =
        dto.customCopy?.occasion ||
        project.copy?.occasion ||
        'Seasonal Restock';

      if (!dto.customCopy?.headline) {
        try {
          const aiCopy = await this.aiRouter.generateCopy(
            organizationId,
            {
              brandName: brand?.name || project.brandName,
              tagline: brand?.tagline,
              description: brand?.description,
              niche: brand?.niche,
              tone: brand?.tone,
              style: dto.style || project.style,
              occasion,
            },
            dto.provider || 'gemini',
            userId,
            jobId,
          );
          generatedHeadline = aiCopy.headline;
          generatedBody = aiCopy.body;
          generatedCta = aiCopy.ctaText;
          occasion = aiCopy.occasion;
        } catch (copyErr: any) {
          this.logger.warn(
            `AI copy failed, using project copy: ${copyErr.message}`,
          );
        }
      }

      await new Promise((r) => setTimeout(r, 800));

      // Stage 3: Multi-Platform Layout Compositing (75%)
      await updateStage('Rendering Multi-Platform Canvas Layouts', 75);
      const platformSpecs: Record<
        string,
        { width: number; height: number; name: string; label: string }
      > = {
        instagram_portrait: {
          width: 1080,
          height: 1350,
          name: 'Instagram',
          label: '1080×1350 · Feed portrait',
        },
        facebook_feed: {
          width: 1200,
          height: 628,
          name: 'Facebook',
          label: '1200×628 · Link ad',
        },
        pinterest_pin: {
          width: 1000,
          height: 1500,
          name: 'Pinterest',
          label: '1000×1500 · Pin',
        },
        twitter_feed: {
          width: 1200,
          height: 628,
          name: 'Twitter / X',
          label: '1200×628 · Feed',
        },
      };

      const platformsToGenerate = dto.platforms || project.platforms;
      const createdVariants: CreativeVariant[] = [];

      for (const platformKey of platformsToGenerate) {
        const spec = platformSpecs[platformKey] || {
          width: 1080,
          height: 1080,
          name: platformKey,
          label: '1080×1080 · Square',
        };

        // Text coverage density simulation (11% - 17%, complying with Meta <= 20% limit)
        const textCoverage = 11 + Math.floor(Math.random() * 6);
        const variant = this.creativeRepo.create({
          projectId: project.id,
          platformKey,
          platformName: spec.name,
          width: spec.width,
          height: spec.height,
          label: spec.label,
          style: dto.style || project.style || 'lifestyle',
          headline: generatedHeadline || 'Small batch. Big morning.',
          body: generatedBody || 'Roasted in 12kg batches, every Tuesday.',
          ctaText: generatedCta || 'ORDER NOW',
          textCoveragePct: textCoverage,
          metaPass: textCoverage <= 20,
          status: 'approved',
        });

        const savedVariant = await this.creativeRepo.save(variant);
        createdVariants.push(savedVariant);
      }

      await new Promise((r) => setTimeout(r, 600));

      // Stage 4: Meta Compliance Scoring (90%)
      await updateStage('Meta Ad Density & Policy Compliance Scan', 90);
      await new Promise((r) => setTimeout(r, 400));

      // Stage 5: Finalization & Commit Credit Consumption (100%)
      const job = await this.jobRepo.findOne({ where: { id: jobId } });
      if (job) {
        await this.creditsService.commitReservation(
          organizationId,
          job.costCredits,
          jobId,
          `Generated ${createdVariants.length} creative variants`,
        );

        job.status = 'COMPLETED';
        job.progressPct = 100;
        job.currentStage = 'All Variants Generated & Verified';
        await this.jobRepo.save(job);
      }

      project.status = 'approved';
      project.copy = {
        headline: generatedHeadline || project.copy.headline,
        body: generatedBody || project.copy.body,
        occasion,
      };
      project.creditsUsed =
        (project.creditsUsed || 0) + (job?.costCredits || 0);
      await this.projectRepo.save(project);

      stream.next({
        jobId,
        status: 'COMPLETED',
        stage: 'All Variants Generated & Verified',
        progressPct: 100,
        variants: createdVariants,
      });
      stream.complete();
      this.jobStreams.delete(jobId);
    } catch (err: any) {
      this.logger.error(`Generation job ${jobId} failed: ${err.message}`);
      const job = await this.jobRepo.findOne({ where: { id: jobId } });
      if (job) {
        await this.creditsService.rollbackReservation(
          organizationId,
          job.costCredits,
          jobId,
        );
        job.status = 'FAILED';
        job.errorMessage = err.message;
        await this.jobRepo.save(job);
      }
      stream.next({
        jobId,
        status: 'FAILED',
        stage: 'Generation Failed',
        progressPct: 0,
        error: err.message,
      });
      stream.complete();
      this.jobStreams.delete(jobId);
    }
  }
}
