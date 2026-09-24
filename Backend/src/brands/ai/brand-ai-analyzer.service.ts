import {
  Injectable,
  Logger,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { WebsiteSnapshot } from '../crawler/interfaces/website-crawler.interface';
import { BrandAIAnalyzer } from './interfaces/brand-ai-analyzer.interface';
import { BrandAnalysisResult } from '../website-analyzer.service';
import {
  WEBSITE_ANALYZER_CONFIG,
  validateGeminiConfig,
} from '../../config/website-analyzer.config';

/**
 * AI Brand Intelligence Analyzer powered by Google Gemini.
 * Performs deep semantic interpretation of extracted website data (not responsible for crawling).
 * Uses official GoogleGenAI SDK with automatic REST fallback utilizing the same configured model.
 */
@Injectable()
export class BrandAiAnalyzerService implements BrandAIAnalyzer, OnModuleInit {
  readonly name = 'gemini-brand-analyzer';
  private readonly logger = new Logger(BrandAiAnalyzerService.name);

  onModuleInit() {
    const configStatus = validateGeminiConfig();
    if (!configStatus.isValid) {
      this.logger.warn(`[BrandAIAnalyzer] Gemini is not configured: ${configStatus.error}`);
    } else {
      this.logger.log(`[BrandAIAnalyzer] Gemini provider initialized`);
      this.logger.log(`[BrandAIAnalyzer] Gemini model: ${configStatus.model}`);
      this.logger.log(`[BrandAIAnalyzer] Gemini API mode: SDK`);
    }
  }

  /**
   * Helper to identify if an error is a non-retryable 404 / Model Not Found error.
   */
  private isModelNotFoundError(err: any): boolean {
    if (!err) return false;
    if (err.status === 404 || err.statusCode === 404) return true;
    const msg = String(err.message || '').toLowerCase();
    return (
      msg.includes('not found') ||
      msg.includes('not_found') ||
      msg.includes('404') ||
      msg.includes('not supported for generatecontent') ||
      msg.includes('no longer available')
    );
  }

  async analyze(
    snapshot: WebsiteSnapshot,
    onStep?: (stepId: string, label: string) => Promise<void> | void,
  ): Promise<BrandAnalysisResult> {
    const {
      url,
      title,
      description,
      headings,
      text,
      openGraph,
      structuredData,
      colors,
      fonts,
      logo,
      favicon,
      availableLogos,
      socialLinks,
      images,
      crawledPages,
    } = snapshot;

    const apiKey = WEBSITE_ANALYZER_CONFIG.geminiApiKey;
    const model = WEBSITE_ANALYZER_CONFIG.geminiModel;

    if (!apiKey || apiKey.trim().length === 0) {
      this.logger.error(
        `[BrandAIAnalyzer] Failure: provider=gemini model=${model} operation=analyze errorCategory=missing_api_key`,
      );
      throw new BadRequestException(
        'Gemini AI is not configured. Please set GEMINI_API_KEY in backend environment.',
      );
    }

    if (onStep) await onStep('brand_info', 'Analyzing brand information with Gemini AI...');

    const parsedDomain = new URL(url).hostname;
    let fallbackBrandName =
      openGraph?.siteName ||
      parsedDomain.replace(/^www\./i, '').split('.')[0];
    fallbackBrandName =
      fallbackBrandName.charAt(0).toUpperCase() + fallbackBrandName.slice(1);

    this.logger.log(`[BrandAIAnalyzer] Starting Gemini analysis using model: ${model}`);

    const systemPrompt = `You are an expert AI brand intelligence analyst.
Analyze the provided extracted website data and determine structured brand intelligence.

CRITICAL RULES:
1. DO NOT fabricate or hallucinate information. If not present in the extracted data, return null or empty array.
2. NEVER invent products, prices, certifications, awards, statistics, or customer testimonials.
3. Base conclusions strictly on available evidence in the website snapshot.
4. Determine: brandName, tagline, industry, subIndustry, country, city, description, companyDescription, valueProposition, products, services, targetAudience, locations, benefits, painPoints, keywords, categories, and brandVoice.

Return ONLY a valid JSON object matching this exact structure:
{
  "brandName": string,
  "tagline": string | null,
  "industry": string | null,
  "subIndustry": string | null,
  "country": string | null,
  "city": string | null,
  "description": string | null,
  "companyDescription": string | null,
  "valueProposition": string | null,
  "products": [{"name": string, "description": string, "category": string}],
  "services": [{"name": string, "description": string}],
  "targetAudience": [{"segment": string, "description": string}],
  "locations": [{"country": string, "city": string}],
  "benefits": string[],
  "painPoints": string[],
  "keywords": string[],
  "categories": string[],
  "brandVoice": {
    "tone": string[],
    "formality": "low" | "medium" | "high",
    "humor": "low" | "medium" | "high",
    "technicality": "low" | "medium" | "high",
    "emotion": "low" | "medium" | "high"
  },
  "confidence": {
    "brandName": number,
    "industry": number,
    "products": number,
    "services": number,
    "targetAudience": number
  }
}`;

    const userPrompt = `Website URL: ${url}
Domain: ${parsedDomain}
Page Title: ${title || 'N/A'}
Meta Description: ${description || 'N/A'}
OpenGraph Site Name: ${openGraph?.siteName || 'N/A'}
Detected Headings: ${headings.slice(0, 30).join(' | ')}
Extracted JSON-LD: ${JSON.stringify(structuredData || []).slice(0, 1500)}
Detected Colors: ${colors.join(', ')}
Detected Fonts: ${fonts.join(', ')}

Extracted Content:
${text.slice(0, 15000)}`;

    let aiOutput: any = null;

    // Attempt 1: Official GoogleGenAI SDK
    try {
      const client = new GoogleGenAI({ apiKey });
      const response = await client.models.generateContent({
        model,
        contents: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text;
      if (responseText) {
        aiOutput = JSON.parse(responseText);
        this.logger.log(`[BrandAIAnalyzer] Gemini SDK analysis completed successfully`);
      }
    } catch (sdkErr: any) {
      if (this.isModelNotFoundError(sdkErr)) {
        this.logger.error(
          `[BrandAIAnalyzer] Failure: provider=gemini model=${model} operation=generateContent HTTP=404 errorCategory=model_not_found`,
        );
        throw new BadRequestException(
          `Configured Gemini model "${model}" is unavailable or does not support generateContent. Check GEMINI_MODEL and the configured Gemini API version.`,
        );
      }

      // Transient failure: log and attempt REST fallback with same configured model
      this.logger.warn(
        `[BrandAIAnalyzer] Transient SDK failure: ${sdkErr.message}. Trying REST fallback with ${model}.`,
      );

      // Attempt 2: REST API Fallback
      try {
        const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(restUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        });

        if (res.status === 404) {
          this.logger.error(
            `[BrandAIAnalyzer] Failure: provider=gemini model=${model} operation=generateContent HTTP=404 errorCategory=model_not_found`,
          );
          throw new BadRequestException(
            `Configured Gemini model "${model}" is unavailable or does not support generateContent. Check GEMINI_MODEL and the configured Gemini API version.`,
          );
        }

        if (res.ok) {
          const data: any = await res.json();
          const textPart = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textPart) {
            aiOutput = JSON.parse(textPart);
            this.logger.log(`[BrandAIAnalyzer] Gemini REST fallback completed successfully`);
          }
        } else {
          const errText = await res.text();
          this.logger.error(
            `[BrandAIAnalyzer] Failure: provider=gemini model=${model} operation=generateContent HTTP=${res.status} errorCategory=rest_api_error: ${errText}`,
          );
          throw new BadRequestException(
            `Website was analyzed, but AI brand interpretation failed (HTTP ${res.status}).`,
          );
        }
      } catch (restErr: any) {
        if (restErr instanceof BadRequestException) {
          throw restErr;
        }
        this.logger.error(
          `[BrandAIAnalyzer] Failure: provider=gemini model=${model} operation=generateContent errorCategory=rest_network_failure: ${restErr.message}`,
        );
        throw new BadRequestException(
          `Website was analyzed, but AI brand interpretation failed: ${restErr.message}`,
        );
      }
    }

    if (!aiOutput || typeof aiOutput !== 'object') {
      throw new BadRequestException(
        'Website was analyzed, but AI brand interpretation failed to produce valid structured data.',
      );
    }

    if (onStep) await onStep('products', 'Detecting products and services...');
    if (onStep) await onStep('social', 'Detecting social profiles and brand identity...');

    const brandName = aiOutput.brandName || fallbackBrandName;
    const brandDescription =
      aiOutput.description ||
      description ||
      text.slice(0, 250) ||
      null;

    const tagline =
      aiOutput.tagline ||
      (title && title.includes('|') ? title.split('|')[1]?.trim() : null);

    const industry = aiOutput.industry || null;
    const subIndustry = aiOutput.subIndustry || null;
    const country = aiOutput.country || null;
    const city = aiOutput.city || null;
    const companyDescription = aiOutput.companyDescription || brandDescription;
    const valueProposition = aiOutput.valueProposition || null;
    const products = Array.isArray(aiOutput.products) ? aiOutput.products : [];
    const services = Array.isArray(aiOutput.services) ? aiOutput.services : [];
    const targetAudience = Array.isArray(aiOutput.targetAudience) ? aiOutput.targetAudience : [];
    const locations = Array.isArray(aiOutput.locations) ? aiOutput.locations : [];
    const benefits = Array.isArray(aiOutput.benefits) ? aiOutput.benefits : [];
    const painPoints = Array.isArray(aiOutput.painPoints) ? aiOutput.painPoints : [];
    const keywords = Array.isArray(aiOutput.keywords) ? aiOutput.keywords : [];
    const categories = Array.isArray(aiOutput.categories) ? aiOutput.categories : [];

    const brandVoice = aiOutput.brandVoice || {
      tone: ['professional', 'modern', 'approachable'],
      formality: 'medium',
      humor: 'low',
      technicality: 'medium',
      emotion: 'medium',
    };

    const tone = Array.isArray(brandVoice?.tone)
      ? brandVoice.tone.join(', ')
      : 'Technical & Modern';

    const confidence = aiOutput.confidence || {
      brandName: 0.95,
      industry: industry ? 0.85 : 0.4,
      products: products.length > 0 ? 0.9 : 0.5,
      services: services.length > 0 ? 0.9 : 0.5,
      targetAudience: targetAudience.length > 0 ? 0.8 : 0.5,
    };

    const primaryColor = colors[0] || '#7c5cff';
    const secondaryColor = colors[1] || '#e0aa4e';
    const accentColor = colors[2] || '#3ecf8e';
    const secondaryColors = colors.slice(1);

    const fontHeading = fonts[0] || 'Plus Jakarta Sans';
    const fontBody = fonts[1] || fonts[0] || 'Inter';

    const socialMap: Record<string, string> = {};
    for (const item of socialLinks || []) {
      socialMap[item.platform] = item.url;
    }

    const brandImagesList = (images || []).map((img) => img.url);

    if (onStep) await onStep('complete', 'Brand details are ready.');

    return {
      brandName,
      tagline,
      websiteUrl: url,
      industry,
      subIndustry,
      country,
      city,
      description: brandDescription,
      companyDescription,
      valueProposition,
      logoUrl: logo || null,
      faviconUrl: favicon || null,
      availableLogos: availableLogos || [],
      primaryColor,
      secondaryColor,
      accentColor,
      secondaryColors,
      fontHeading,
      fontBody,
      tone,
      products,
      services,
      targetAudience,
      locations,
      benefits,
      painPoints,
      keywords,
      categories,
      socialLinks: socialMap,
      brandVoice,
      brandImages: brandImagesList,
      confidence,
      sourceUrls: (crawledPages || []).map((p) => p.url),
    };
  }
}
