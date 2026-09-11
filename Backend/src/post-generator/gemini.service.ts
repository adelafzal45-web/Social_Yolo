import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

/** Input for one Gemini image-generation call. */
export interface GeneratePostImageParams {
  /** The full designer-style prompt. */
  prompt: string;
  /** Optional subject image (transparent PNG from the bg-removal pipeline), base64. */
  imageBase64?: string;
  /** MIME type of the input image; defaults to image/png. */
  imageMimeType?: string;
}

/** One generated image returned by Gemini. */
export interface GeneratedImage {
  imageBase64: string;
  mimeType: string;
  /** Any text Gemini returned alongside the image (explanations, notes). */
  modelText?: string;
}

/**
 * Thin wrapper around the Google Gemini API (`@google/genai`).
 *
 * Uses the image-generation-capable model from `GEMINI_IMAGE_MODEL`
 * (default `gemini-2.5-flash-image`, aka "Nano Banana") which accepts
 * an optional input image — exactly the bg-removal use case.
 */
@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);

  private readonly client: GoogleGenAI | null;
  private readonly model: string;

  constructor() {
    this.model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.client = new GoogleGenAI({ apiKey });
    } else {
      this.client = null;
      this.logger.warn(
        'GEMINI_API_KEY is not set — post generation will answer 503 until it is added to Backend/.env',
      );
    }
  }

  /** True when an API key is configured. */
  get isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Generates one finished post image. When `imageBase64` is provided the
   * model edits/incorporates that image; otherwise it generates from text alone.
   */
  async generatePostImage(params: GeneratePostImageParams): Promise<GeneratedImage> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Gemini is not configured: set GEMINI_API_KEY in Backend/.env and restart the backend.',
      );
    }

    // Image first, then the instructions — editing models anchor better on
    // the reference photo when it precedes the prompt text.
    const contents: Array<Record<string, unknown>> = [];
    if (params.imageBase64) {
      contents.push({
        inlineData: {
          mimeType: params.imageMimeType || 'image/png',
          data: params.imageBase64,
        },
      });
    }
    contents.push({ text: params.prompt });

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents,
      });

      const parts = (response.candidates?.[0]?.content?.parts ?? []) as unknown as Array<{
        text?: string;
        inlineData?: { mimeType?: string; data?: string };
      }>;

      const imagePart = parts.find((part) => part.inlineData && part.inlineData.data);
      if (!imagePart || !imagePart.inlineData?.data) {
        const textOut = parts
          .map((part) => part.text ?? '')
          .join(' ')
          .trim();
        throw new BadRequestException(
          textOut
            ? `Gemini did not return an image. Model said: ${textOut}`
            : 'Gemini returned no image and no explanation.',
        );
      }

      const textOut = parts
        .map((part) => part.text ?? '')
        .join(' ')
        .trim();

      return {
        imageBase64: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType || 'image/png',
        modelText: textOut || undefined,
      };
    } catch (error) {
      // Re-throw the NestJS exceptions we raised ourselves.
      if (error instanceof HttpException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Gemini image generation failed: ${message}`);
      throw new BadGatewayException(`Gemini image generation failed: ${message}`);
    }
  }
}