import { WebsiteSnapshot } from '../../crawler/interfaces/website-crawler.interface';
import { BrandAnalysisResult } from '../../website-analyzer.service';

/**
 * Contract for AI Brand Intelligence interpretation engines.
 */
export interface BrandAIAnalyzer {
  readonly name: string;
  analyze(
    snapshot: WebsiteSnapshot,
    onStep?: (stepId: string, label: string) => Promise<void> | void,
  ): Promise<BrandAnalysisResult>;
}
