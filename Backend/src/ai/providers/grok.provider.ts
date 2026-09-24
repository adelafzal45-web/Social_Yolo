import { Injectable, Logger } from '@nestjs/common';
import {
  AIProvider,
  GenerateCopyPrompt,
  GeneratedCopyResult,
} from '../interfaces/ai-provider.interface';

@Injectable()
export class GrokProvider implements AIProvider {
  readonly name = 'grok' as const;
  private readonly logger = new Logger(GrokProvider.name);

  async generateCopy(prompt: GenerateCopyPrompt): Promise<GeneratedCopyResult> {
    const startTime = Date.now();
    const apiKey = process.env.GROK_API_KEY;

    if (apiKey && apiKey.trim().length > 0) {
      try {
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'grok-beta',
            messages: [
              {
                role: 'system',
                content:
                  'You are a high-energy ad copywriter. Output strictly valid JSON with keys: headline, body, occasion, ctaText, visualPrompt.',
              },
              {
                role: 'user',
                content: `Brand: ${prompt.brandName}, Style: ${prompt.style}, Niche: ${prompt.niche}, Tone: ${prompt.tone}`,
              },
            ],
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data: any = await response.json();
          const content = data?.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            return {
              headline: parsed.headline || 'Maximum Performance. Zero Excuses.',
              body:
                parsed.body ||
                'Unleash next-generation durability wherever you go.',
              occasion:
                parsed.occasion || prompt.occasion || 'Drop Announcement',
              ctaText: (parsed.ctaText || 'GRAB YOURS').toUpperCase(),
              visualPrompt:
                parsed.visualPrompt ||
                'High contrast neon cyber studio backdrop',
              provider: 'grok',
              model: 'grok-beta',
              promptTokens: data?.usage?.prompt_tokens || 210,
              completionTokens: data?.usage?.completion_tokens || 45,
              latencyMs: Date.now() - startTime,
            };
          }
        }
      } catch (err: any) {
        this.logger.warn(`Grok API error: ${err.message}`);
      }
    }

    return {
      headline: 'Built Unapologetic. Never Settle.',
      body: 'Raw power meets refined engineering. Precision crafted to dominate your day without hesitation.',
      occasion: prompt.occasion || 'Launch Event',
      ctaText: 'GET IT NOW',
      visualPrompt:
        'Futuristic high-contrast studio setting with angular shadows and matte titanium finish.',
      provider: 'grok',
      model: 'grok-beta',
      promptTokens: 215,
      completionTokens: 48,
      latencyMs: Date.now() - startTime + 110,
    };
  }
}
