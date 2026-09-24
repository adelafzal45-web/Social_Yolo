export interface GenerateCopyPrompt {
  brandName: string;
  tagline?: string;
  description?: string;
  niche?: string;
  tone?: string;
  style?: string;
  occasion?: string;
  customNote?: string;
  platform?: string;
  ragContext?: string[];
}

export interface GeneratedCopyResult {
  headline: string;
  body: string;
  occasion: string;
  ctaText: string;
  visualPrompt?: string;
  provider: 'gemini' | 'grok' | 'openai' | 'claude' | 'synthesizer';
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
}

export interface AIProvider {
  readonly name: 'gemini' | 'grok' | 'openai' | 'claude';
  generateCopy(prompt: GenerateCopyPrompt): Promise<GeneratedCopyResult>;
}
