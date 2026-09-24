import { Injectable, Logger } from '@nestjs/common';
import { RedisCacheService } from '../common/cache/redis-cache.service';
import {
  WebsiteAnalyzerService,
  BrandAnalysisResult,
  CrawledPage,
} from './website-analyzer.service';

export interface AnalysisJobStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface AnalysisJobStatus {
  jobId: string;
  url: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  steps: AnalysisJobStep[];
  result?: BrandAnalysisResult | null;
  crawledPages?: CrawledPage[];
  error?: string | null;
  createdAt: number;
  updatedAt: number;
}

const DEFAULT_STEPS: { id: string; label: string }[] = [
  { id: 'connected', label: 'Website connected' },
  { id: 'content_collected', label: 'Website content collected' },
  { id: 'brand_info', label: 'Brand information detected' },
  { id: 'products', label: 'Products detected' },
  { id: 'services', label: 'Services detected' },
  { id: 'social', label: 'Social profiles detected' },
  { id: 'identity', label: 'Brand identity analyzed' },
];

@Injectable()
export class BrandAnalysisProcessor {
  private readonly logger = new Logger(BrandAnalysisProcessor.name);

  constructor(
    private readonly redisCache: RedisCacheService,
    private readonly websiteAnalyzer: WebsiteAnalyzerService,
  ) {}

  /**
   * Initializes a new analysis job in Redis and kicks off background processing.
   * If forceFresh is false, checks for duplicate active/completed analysis to prevent redundant crawling.
   */
  async createJob(url: string, brandId?: string, forceFresh = false): Promise<string> {
    const normalizedUrl = this.websiteAnalyzer.normalizeUrl(url);

    // Duplicate analysis protection: check for recent active or completed job if not forceFresh
    if (!forceFresh) {
      const recentJobId = await this.redisCache.get<string>(`brand_url_recent:${normalizedUrl}`);
      if (recentJobId) {
        const existingJob = await this.getJob(recentJobId);
        if (existingJob && (existingJob.status === 'processing' || existingJob.status === 'completed')) {
          this.logger.log(`[BrandAnalysisProcessor] Reusing recent job ${recentJobId} for ${normalizedUrl}`);
          return existingJob.jobId;
        }
      }
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const initialJob: AnalysisJobStatus = {
      jobId,
      url: normalizedUrl,
      status: 'queued',
      progress: 5,
      currentStep: 'Initializing website analysis...',
      steps: DEFAULT_STEPS.map((s) => ({
        id: s.id,
        label: s.label,
        status: 'pending',
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.saveJob(initialJob);

    // Map URL to recent jobId for 10 minutes to avoid rapid duplicate triggers
    await this.redisCache.set(`brand_url_recent:${normalizedUrl}`, jobId, 600);

    // Kick off background job without blocking caller
    setImmediate(() => {
      this.processJob(jobId, normalizedUrl, brandId, forceFresh).catch((err) => {
        this.logger.error(`[BrandAnalysisProcessor] Job ${jobId} failed with unhandled error: ${err.message}`);
      });
    });

    return jobId;
  }

  /**
   * Retrieves the current state of a brand analysis job.
   */
  async getJob(jobId: string): Promise<AnalysisJobStatus | null> {
    return this.redisCache.get<AnalysisJobStatus>(`brand_analysis:${jobId}`);
  }

  private async saveJob(job: AnalysisJobStatus): Promise<void> {
    job.updatedAt = Date.now();
    // Cache job status for 1 hour
    await this.redisCache.set(`brand_analysis:${job.jobId}`, job, 3600);
  }

  private updateStepStatus(
    steps: AnalysisJobStep[],
    stepId: string,
    status: AnalysisJobStep['status'],
  ) {
    const step = steps.find((s) => s.id === stepId);
    if (step) {
      step.status = status;
    }
  }

  /**
   * Executes the autonomous crawl and AI analysis pipeline.
   */
  private async processJob(
    jobId: string,
    url: string,
    brandId?: string,
    forceFresh = false,
  ): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) return;

    this.logger.log(`[BrandAnalysisProcessor] Starting job ${jobId} for: ${url}`);
    job.status = 'processing';
    job.progress = 15;
    job.currentStep = 'Connecting to website...';
    await this.saveJob(job);

    try {
      // Step 1: Crawl website locally (HTTP first, Playwright fallback if JS-heavy)
      const crawlData = await this.websiteAnalyzer.crawlWebsite(
        url,
        async (stepId, label) => {
          job.currentStep = label;
          if (stepId === 'connected') {
            job.progress = 30;
            this.updateStepStatus(job.steps, 'connected', 'completed');
            this.updateStepStatus(job.steps, 'content_collected', 'in_progress');
          } else if (stepId === 'content_collected') {
            job.progress = 55;
            this.updateStepStatus(job.steps, 'content_collected', 'completed');
            this.updateStepStatus(job.steps, 'brand_info', 'in_progress');
          }
          await this.saveJob(job);
        },
        forceFresh,
      );

      job.crawledPages = crawlData.pages;

      // Step 2: AI Brand Profile Interpretation via Gemini
      const result = await this.websiteAnalyzer.buildBrandProfileWithAi(
        crawlData,
        async (stepId, label) => {
          job.currentStep = label;
          if (stepId === 'brand_info') {
            job.progress = 70;
            this.updateStepStatus(job.steps, 'brand_info', 'completed');
            this.updateStepStatus(job.steps, 'products', 'in_progress');
            this.updateStepStatus(job.steps, 'services', 'in_progress');
          } else if (stepId === 'products') {
            job.progress = 85;
            this.updateStepStatus(job.steps, 'products', 'completed');
            this.updateStepStatus(job.steps, 'services', 'completed');
            this.updateStepStatus(job.steps, 'social', 'in_progress');
          } else if (stepId === 'social') {
            job.progress = 92;
            this.updateStepStatus(job.steps, 'social', 'completed');
            this.updateStepStatus(job.steps, 'identity', 'in_progress');
          } else if (stepId === 'complete') {
            this.updateStepStatus(job.steps, 'identity', 'completed');
          }
          await this.saveJob(job);
        },
      );

      // Finalize completed state
      job.status = 'completed';
      job.progress = 100;
      job.currentStep = 'Brand details are ready.';
      job.steps.forEach((s) => (s.status = 'completed'));
      job.result = result;

      await this.saveJob(job);
      this.logger.log(`[BrandAnalysisProcessor] Job ${jobId} completed successfully for URL: ${url}`);
    } catch (err: any) {
      job.status = 'failed';
      job.currentStep = 'Website analysis could not complete.';
      job.error =
        err.message || 'Unable to connect to website. Please check the URL or enter details manually.';

      // Mark running step as failed
      for (const step of job.steps) {
        if (step.status === 'in_progress') {
          step.status = 'failed';
          break;
        }
      }

      await this.saveJob(job);
      this.logger.warn(`[BrandAnalysisProcessor] Job ${jobId} failed: ${err.message}`);
    }
  }
}
