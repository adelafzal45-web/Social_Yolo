import { Injectable, Logger } from '@nestjs/common';
import { mkdir, writeFile } from 'fs/promises';
import { resolve } from 'path';

import { UploadedFile } from '../common/upload/image-upload';
import { ImageProcessingService } from '../image-processing/image-processing.service';
import { PostsService } from '../posts/posts.service';
import { PostResponseDto } from './dto/post-response.dto';
import { GeminiService } from './gemini.service';
import type { GeneratedImage } from './gemini.service';
import { PollinationsService } from './providers/pollinations.service';
import { EmbeddingsService } from './rag/embeddings.service';
import { PromptBuilderService } from './rag/prompt-builder.service';
import { RetrievedStyle, RetrieverService } from './rag/retriever.service';

/**
 * Orchestrates one post generation:
 *
 * 1. (optional) run the uploaded subject image through the existing
 *    bg-removal pipeline (`ImageProcessingService`);
 * 2. RAG: embed the user's short prompt, retrieve the most similar
 *    high-rated past posts + sample posts, and build the final
 *    designer-style prompt (`PromptBuilderService`);
 * 3. call the image engine (`GeminiService`, with an automatic fallback to
 *    Pollinations when Gemini fails — e.g. the free tier has zero
 *    image-generation quota);
 * 4. store the PNG under `public/generated-posts/` and persist a row
 *    through `PostsService`.
 *
 * Every RAG step degrades gracefully — if embedding/retrieval fails the
 * generation continues with the user prompt alone.
 */
@Injectable()
export class PostGeneratorService {
  private readonly logger = new Logger(PostGeneratorService.name);

  private readonly outputDir = resolve(process.cwd(), 'public', 'generated-posts');

  constructor(
    private readonly imageProcessingService: ImageProcessingService,
    private readonly geminiService: GeminiService,
    private readonly pollinationsService: PollinationsService,
    private readonly postsService: PostsService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly retrieverService: RetrieverService,
    private readonly promptBuilder: PromptBuilderService,
  ) {}

  /** Which image engine to use — `IMAGE_PROVIDER` in `.env` (gemini | pollinations). */
  private get provider(): 'gemini' | 'pollinations' {
    return (process.env.IMAGE_PROVIDER || 'gemini') as 'gemini' | 'pollinations';
  }

  /**
   * Generates one designer-style post.
   *
   * @param userPrompt The short text the user typed.
   * @param file Optional subject image; its background is removed first.
   * @param userId Owner id (null until auth exists — retrieval then uses
   *   only the global sample pool).
   */
  async generatePost(
    userPrompt: string,
    file?: UploadedFile,
    userId: string | null = null,
  ): Promise<PostResponseDto> {
    // 1. Optional bg removal (Gemini only — Pollinations is text-to-image
    //    and cannot use the subject image).
    let subjectBase64: string | undefined;
    let backgroundRemoved = false;
    if (file && this.provider === 'gemini') {
      const processed = await this.imageProcessingService.processImageWithStatus(file);
      subjectBase64 = processed.buffer.toString('base64');
      backgroundRemoved = processed.backgroundRemoved;
      this.logger.log(
        `Subject image attached (~${Math.round((subjectBase64.length * 0.75) / 1024)} KB, ` +
          `${backgroundRemoved ? 'background removed' : 'bg-removal unavailable — original bytes used'})`,
      );
    } else if (file) {
      this.logger.warn(
        'IMAGE_PROVIDER=pollinations: the subject image is not used by this ' +
          'provider (text-to-image only) — the design relies on the prompt alone.',
      );
    }

    // 2. RAG — embed → retrieve → build. Failures degrade gracefully.
    let styles: RetrievedStyle[] = [];
    try {
      const queryEmbedding = await this.embeddingsService.embedText(userPrompt);
      styles = await this.retrieverService.retrieveStyleContext(userId, queryEmbedding);
      this.logger.log(
        `RAG retrieved ${styles.length} style reference(s): ` +
          styles
            .map((style) => `${style.source}(${(style.similarity * 100).toFixed(0)}%)`)
            .join(', '),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`RAG style retrieval skipped (${message}). Proceeding without it.`);
    }

    let finalPrompt = this.promptBuilder.buildFinalPrompt(
      userPrompt,
      styles,
      Boolean(subjectBase64),
      this.provider,
      backgroundRemoved,
    );
    this.logger.log(`Final prompt sent to ${this.provider}:\n${finalPrompt}`);

    // 3. Image generation via the configured provider, with an automatic
    //    fallback to Pollinations when Gemini fails. The Gemini free tier
    //    has ZERO image-generation quota (429 with `limit: 0`), so quota
    //    errors are permanent until billing is enabled — instead of failing
    //    the whole request, degrade to the free engine. Pollinations is
    //    text-to-image only, so fallback designs do NOT contain the
    //    subject photo (the response's `engine` field reports this).
    let generated: GeneratedImage;
    let usedProvider: 'gemini' | 'pollinations' = this.provider;
    if (this.provider === 'pollinations') {
      generated = await this.pollinationsService.generatePostImage({ prompt: finalPrompt });
    } else {
      try {
        generated = await this.geminiService.generatePostImage({
          prompt: finalPrompt,
          imageBase64: subjectBase64,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Gemini image generation failed (${message.slice(0, 200)}…). ` +
            'Falling back to Pollinations — the subject photo is NOT included in fallback designs. ' +
            'Enable billing on your Google AI Studio project for the full pipeline.',
        );
        usedProvider = 'pollinations';
        finalPrompt = this.promptBuilder.buildFinalPrompt(userPrompt, styles, false, 'pollinations');
        this.logger.log(`Fallback prompt sent to Pollinations:\n${finalPrompt}`);
        generated = await this.pollinationsService.generatePostImage({ prompt: finalPrompt });
      }
    }

    // 4. Persist DB row first (id needed for the file name), then the file.
    const post = await this.postsService.createPost({ userPrompt, finalPrompt });
    const ext = generated.mimeType === 'image/png' ? 'png' : 'jpg';
    const fileName = `${post.id}.${ext}`;
    await mkdir(this.outputDir, { recursive: true });
    await writeFile(
      resolve(this.outputDir, fileName),
      Buffer.from(generated.imageBase64, 'base64'),
    );

    const imagePath = `generated-posts/${fileName}`;
    await this.postsService.postRepository.update(post.id, { imagePath });

    this.logger.log(`Generated post ${post.id} via ${usedProvider} (${imagePath})`);

    return {
      id: post.id,
      imageUrl: `/${imagePath}`,
      userPrompt,
      finalPrompt,
      rating: null,
      engine: usedProvider,
      createdAt: post.createdAt,
    };
  }
}