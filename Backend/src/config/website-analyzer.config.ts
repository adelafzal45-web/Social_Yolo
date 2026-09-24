import { Logger } from '@nestjs/common';

/**
 * Production configuration for Website Analyzer & Brand AI Intelligence Engine.
 * All settings are environment-driven with secure, production-grade defaults.
 */

const logger = new Logger('WebsiteAnalyzerConfig');

export const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';

const DEPRECATED_GEMINI_MODELS = new Set([
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-1.0-pro',
  'gemini-2.5-flash',
]);

function numberSetting(
  name: string,
  fallback: number,
  min: number,
  max: number,
  integer = false,
): number {
  const raw = process.env[name];
  const value = raw !== undefined && raw.trim() !== '' ? Number(raw) : fallback;
  if (
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    (integer && !Number.isInteger(value))
  ) {
    return fallback;
  }
  return value;
}

function booleanSetting(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === null || raw.trim() === '') {
    return fallback;
  }
  const lower = raw.trim().toLowerCase();
  return lower === 'true' || lower === '1' || lower === 'yes';
}

/**
 * Normalizes Gemini model names to ensure consistency across the official SDK and REST API.
 * Strips 'models/' prefix if present and automatically upgrades deprecated/sunset models.
 */
export function normalizeGeminiModel(modelName?: string): string {
  let candidate = (
    modelName ||
    process.env.GEMINI_MODEL ||
    process.env.GEMINI_TEXT_MODEL ||
    DEFAULT_GEMINI_MODEL
  ).trim();

  candidate = candidate.replace(/^models\//i, '');

  if (DEPRECATED_GEMINI_MODELS.has(candidate.toLowerCase())) {
    logger.warn(
      `[Config] Detected deprecated/sunset Gemini model "${candidate}". Automatically upgrading to supported default "${DEFAULT_GEMINI_MODEL}". Please update GEMINI_MODEL in your .env file.`,
    );
    return DEFAULT_GEMINI_MODEL;
  }

  return candidate || DEFAULT_GEMINI_MODEL;
}

/**
 * Validates Gemini configuration at startup or runtime without crashing the application.
 */
export function validateGeminiConfig(): { isValid: boolean; model: string; error?: string } {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = normalizeGeminiModel();

  if (!apiKey) {
    return {
      isValid: false,
      model,
      error: 'GEMINI_API_KEY is not configured in environment variables.',
    };
  }

  return {
    isValid: true,
    model,
  };
}

export const WEBSITE_ANALYZER_CONFIG = {
  /** Maximum time in milliseconds for crawling requests before aborting. */
  timeoutMs: numberSetting('WEBSITE_ANALYZER_TIMEOUT_MS', 15000, 1000, 120000, true),

  /** Maximum allowed HTTP response body size in bytes (prevents memory exhaustion). */
  maxResponseBytes: numberSetting(
    'WEBSITE_ANALYZER_MAX_RESPONSE_BYTES',
    5 * 1024 * 1024, // 5 MB
    100 * 1024,
    50 * 1024 * 1024,
    true,
  ),

  /** Maximum character length of extracted clean text sent to AI interpreter. */
  maxTextLength: numberSetting('WEBSITE_ANALYZER_MAX_TEXT_LENGTH', 30000, 500, 200000, true),

  /** Maximum number of headings (H1-H4) extracted. */
  maxHeadings: numberSetting('WEBSITE_ANALYZER_MAX_HEADINGS', 50, 5, 200, true),

  /** Maximum number of image asset candidates captured. */
  maxImages: numberSetting('WEBSITE_ANALYZER_MAX_IMAGES', 50, 5, 200, true),

  /** Maximum number of key internal sub-pages crawled (e.g. About, Services). */
  maxInternalPages: numberSetting('WEBSITE_ANALYZER_MAX_INTERNAL_PAGES', 5, 0, 20, true),

  /** Minimum meaningful extracted text threshold below which browser fallback triggers. */
  minMeaningfulContentLength: numberSetting(
    'WEBSITE_ANALYZER_MIN_CONTENT_LENGTH',
    200,
    50,
    2000,
    true,
  ),

  /** Enable Playwright browser rendering fallback when HTTP extraction yields insufficient content. */
  browserFallbackEnabled: booleanSetting('WEBSITE_ANALYZER_BROWSER_FALLBACK', true),

  /** Cache TTL in seconds for website crawl snapshots in Redis. */
  cacheTtlSeconds: numberSetting('WEBSITE_ANALYZER_CACHE_TTL_SECONDS', 3600, 60, 86400 * 7, true),

  /** Standard desktop browser User-Agent for ethical crawler requests. */
  userAgent:
    process.env.WEBSITE_ANALYZER_USER_AGENT ||
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 SocialYoloBot/2.0 (+https://socialyolo.ai/bot)',

  /** Centralized Gemini model for brand intelligence analysis. */
  get geminiModel(): string {
    return normalizeGeminiModel();
  },

  /** Gemini API Key */
  get geminiApiKey(): string | undefined {
    return process.env.GEMINI_API_KEY;
  },
};
