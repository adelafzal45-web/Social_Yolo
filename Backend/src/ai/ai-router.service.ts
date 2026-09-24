import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIUsageLog } from '../database/entities';
import {
  AIProvider,
  GenerateCopyPrompt,
  GeneratedCopyResult,
} from './interfaces/ai-provider.interface';
import { GeminiProvider } from './providers/gemini.provider';
import { GrokProvider } from './providers/grok.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { ClaudeProvider } from './providers/claude.provider';

@Injectable()
export class AIRouterService {
  private readonly logger = new Logger(AIRouterService.name);
  private readonly providers: Map<string, AIProvider> = new Map();

  constructor(
    private readonly gemini: GeminiProvider,
    private readonly grok: GrokProvider,
    private readonly openai: OpenAIProvider,
    private readonly claude: ClaudeProvider,
    @InjectRepository(AIUsageLog)
    private readonly logRepo: Repository<AIUsageLog>,
  ) {
    this.providers.set('gemini', gemini);
    this.providers.set('grok', grok);
    this.providers.set('openai', openai);
    this.providers.set('claude', claude);
  }

  async generateCopy(
    organizationId: string,
    prompt: GenerateCopyPrompt,
    preferredProvider = 'gemini',
    userId?: string,
    jobId?: string,
  ): Promise<GeneratedCopyResult> {
    const fallbackChain = [
      preferredProvider,
      'gemini',
      'openai',
      'claude',
      'grok',
    ].filter((v, idx, self) => self.indexOf(v) === idx);

    let lastError: Error | null = null;

    for (const providerName of fallbackChain) {
      const provider = this.providers.get(providerName);
      if (!provider) continue;

      try {
        const result = await provider.generateCopy(prompt);

        // Record AI usage telemetry in PostgreSQL
        try {
          const costEstimateCents =
            (result.promptTokens * 0.00005 +
              result.completionTokens * 0.00015) *
            100;

          const log = this.logRepo.create({
            organizationId,
            userId,
            jobId,
            provider: result.provider as any,
            model: result.model,
            task: 'ad_copy_generation',
            promptTokens: result.promptTokens,
            completionTokens: result.completionTokens,
            latencyMs: result.latencyMs,
            costEstimateCents,
            status: 'SUCCESS',
          });
          await this.logRepo.save(log);
        } catch (logErr: any) {
          this.logger.warn(`Failed to save AIUsageLog: ${logErr.message}`);
        }

        return result;
      } catch (err: any) {
        lastError = err;
        this.logger.warn(
          `Provider ${providerName} failed: ${err.message}. Trying next in fallback chain.`,
        );
      }
    }

    throw lastError || new Error('All AI providers in fallback chain failed.');
  }

  async getRecentLogs(
    organizationId: string,
    limit = 20,
  ): Promise<AIUsageLog[]> {
    return this.logRepo.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
