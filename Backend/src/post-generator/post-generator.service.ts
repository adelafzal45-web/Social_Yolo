import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';

import {
  ALLOWED_IMAGE_MIME_TYPES,
  UploadedFile,
  readFileBuffer,
} from '../common/upload/image-upload';
import { ImageProcessingService } from '../image-processing/image-processing.service';
import { PostsService } from '../posts/posts.service';
import { PostResponseDto } from './dto/post-response.dto';
import {
  DesignBrief,
  POST_SIZES,
  PostSizeKey,
  normalizeCategory,
} from './design-brief';
import { GeminiService } from './gemini.service';
import type { GeneratedImage } from './gemini.service';
import { PollinationsService } from './providers/pollinations.service';
import { EmbeddingsService } from './rag/embeddings.service';
import {
  ImageEmbeddingsService,
  mimeFromImagePath,
} from './rag/image-embeddings.service';
import {
  PromptBuilderService,
  PromptContext,
} from './rag/prompt-builder.service';
import {
  RetrievedImageStyle,
  RetrievedStyle,
  RetrieverService,
} from './rag/retriever.service';

/** Everything needed to generate one post — the shape the front end sends. */
export interface GeneratePostInput {
  /** Short brief/idea of the post (required). */
  userPrompt: string;
  /** Owner id (null until auth exists). */
  userId: string | null;
  /** Optional subject image (product/photo); its background is removed first. */
  file?: UploadedFile;
  /** Optional company logo, placed on the design unchanged. */
  logo?: UploadedFile;
  /** Exact copy/text to write on the post. */
  content?: string | null;
  /** Brand color scheme (free text). */
  colorScheme?: string | null;
  /** Font for all text on the post. */
  font?: string | null;
  /** Design category (gym, food, education…) — scopes RAG retrieval. */
  category?: string | null;
  /** Post size/format key (defaults to `instagram_post`). */
  postSize?: string | null;
  /** Output file type (defaults to `png`). */
  outputType?: string | null;
  /** Free-form design/concept instructions for the planner pass. */
  designConcept?: string | null;
}

/**
 * Orchestrates one post generation:
 *
 * 1. (optional) run the uploaded subject image through the existing
 *    bg-removal pipeline (`ImageProcessingService`) and pick up the
 *    optional company logo (raw bytes — logos keep their own background);
 * 2. RAG: embed the user's short prompt, retrieve the most similar
 *    high-rated past posts + sample posts **of the same category** and
 *    build the final designer-style prompt (`PromptBuilderService`) from
 *    the structured design brief (content, colors, font, category, size,
 *    output type);
 * 3. call the image engine (`GeminiService`, with an automatic fallback to
 *    Pollinations when Gemini fails — e.g. the free tier has zero
 *    image-generation quota);
 * 4. store the image under `public/generated-posts/` and persist a row
 *    (including the category + design brief) through `PostsService`.
 *
 * Every RAG step degrades gracefully — if embedding/retrieval fails the
 * generation continues with the user brief alone.
 */
@Injectable()
export class PostGeneratorService {
  private readonly logger = new Logger(PostGeneratorService.name);

  private readonly outputDir = resolve(
    process.cwd(),
    'public',
    'generated-posts',
  );

  constructor(
    private readonly imageProcessingService: ImageProcessingService,
    private readonly geminiService: GeminiService,
    private readonly pollinationsService: PollinationsService,
    private readonly postsService: PostsService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly imageEmbeddingsService: ImageEmbeddingsService,
    private readonly retrieverService: RetrieverService,
    private readonly promptBuilder: PromptBuilderService,
  ) {}

  /** Which image engine to use — `IMAGE_PROVIDER` in `.env` (gemini | pollinations). */
  private get provider(): 'gemini' | 'pollinations' {
    return (process.env.IMAGE_PROVIDER || 'gemini') as
      | 'gemini'
      | 'pollinations';
  }

  /**
   * Generates one designer-style post.
   *
   * @param input The structured request: the short brief plus optional
   *   design-brief fields (content copy, colors, font, category, post
   *   size, output type), an optional subject image and an optional
   *   company logo.
   */
  async generatePost(input: GeneratePostInput): Promise<PostResponseDto> {
    const {
      userPrompt,
      userId,
      file,
      logo,
      content,
      colorScheme,
      font,
      postSize,
      outputType,
      designConcept,
    } = input;
    const category = normalizeCategory(input.category);

    // Structured design brief — every field is optional; the size/type
    // fall back to instagram_post / png when the client omits them.
    const brief: DesignBrief = {
      content: content?.trim() || null,
      colorScheme: colorScheme?.trim() || null,
      font: font?.trim() || null,
      designConcept: designConcept?.trim() || null,
      category,
      postSize: (postSize && POST_SIZES[postSize as PostSizeKey]
        ? postSize
        : 'instagram_post') as PostSizeKey,
      outputType: outputType === 'jpg' ? 'jpg' : 'png',
    };
    this.logger.log(
      `Design brief: size=${brief.postSize} type=${brief.outputType}` +
        `${category ? ` category=${category}` : ''}` +
        `${brief.colorScheme ? ` colors="${brief.colorScheme}"` : ''}` +
        `${brief.font ? ` font="${brief.font}"` : ''}` +
        `${brief.content ? ` content="${brief.content.slice(0, 60)}…"` : ''}`,
    );

    // 1. Optional bg removal (Gemini only — Pollinations is text-to-image
    //    and cannot use the subject image).
    let subjectBase64: string | undefined;
    let backgroundRemoved = false;
    if (file && this.provider === 'gemini') {
      const processed =
        await this.imageProcessingService.processImageWithStatus(file);
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

    // 1b. Optional company logo — kept as raw bytes (logos must keep their
    //     own background) and passed to Gemini as the SECOND attached image.
    let logoBase64: string | undefined;
    let logoMime: string | undefined;
    if (logo) {
      if (!ALLOWED_IMAGE_MIME_TYPES.includes(logo.mimetype)) {
        throw new BadRequestException(
          `Unsupported logo type "${logo.mimetype}" — use jpg, png or webp.`,
        );
      }
      logoBase64 = (await readFileBuffer(logo)).toString('base64');
      logoMime = logo.mimetype;
      this.logger.log(
        `Company logo attached: ${logo.originalname} ` +
          `(~${Math.round((logoBase64.length * 0.75) / 1024)} KB)`,
      );
    }

    // 2. RAG — embed → retrieve → build. Failures degrade gracefully.
    //    Two retrievals run here, BOTH scoped to the request category when
    //    one was provided (a gym post only borrows style from gym posts):
    //    a) TEXT style: Gemini embedding of the prompt vs. past captions
    //       (post_embeddings);
    //    b) IMAGE style: CLIP text embedding of the prompt vs. past post
    //       IMAGES (post_image_embeddings) — finds posts that LOOK like
    //       what the user is asking for.
    let styles: RetrievedStyle[] = [];
    let imageStyles: RetrievedImageStyle[] = [];
    try {
      const queryEmbedding = await this.embeddingsService.embedText(userPrompt);
      styles = await this.retrieverService.retrieveStyleContext(
        userId,
        queryEmbedding,
        category,
      );
      this.logger.log(
        `RAG retrieved ${styles.length} style reference(s)` +
          (category ? ` in category "${category}"` : '') +
          ': ' +
          styles
            .map(
              (style) =>
                `${style.source}(${(style.similarity * 100).toFixed(0)}%)`,
            )
            .join(', '),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `RAG style retrieval skipped (${message}). Proceeding without it.`,
      );
    }

    try {
      const imageQuery =
        await this.imageEmbeddingsService.embedQuery(userPrompt);
      imageStyles = await this.retrieverService.retrieveImageContext(
        userId,
        imageQuery.vector,
        imageQuery.model,
        category,
      );
      this.logger.log(
        `RAG retrieved ${imageStyles.length} image style reference(s) via ${imageQuery.model}: ` +
          imageStyles
            .map(
              (ref) => `${ref.source}(${(ref.similarity * 100).toFixed(0)}%)`,
            )
            .join(', '),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `RAG image-style retrieval skipped (${message}). Proceeding without it.`,
      );
    }

    const promptContext: PromptContext = {
      brief,
      engine: this.provider,
      hasSubjectImage: Boolean(subjectBase64),
      backgroundRemoved,
      hasLogoImage: Boolean(logoBase64),
    };

    // 2b. Design-PLANNING pass (text model): the structured art-director
    //     brief is turned into a JSON design plan — layout, palette roles,
    //     typography hierarchy and a master "image_generation_prompt". The
    //     plan makes the final render prompt far more detailed and gives
    //     noticeably better posts. Planning must NEVER break generation:
    //     any failure degrades to the direct detailed prompt below.
    let designPlan: Record<string, unknown> | null = null;
    try {
      const plannerPrompt = this.promptBuilder.buildPlannerPrompt(
        userPrompt,
        styles,
        imageStyles,
        promptContext,
      );
      this.logger.log(
        `Planner prompt sent to ${this.geminiService.textModelForLogging}:\n${plannerPrompt}`,
      );
      designPlan = await this.geminiService.generateDesignPlan(plannerPrompt);
      if (designPlan) {
        this.logger.log(
          `Design plan received:\n${JSON.stringify(designPlan, null, 2)}`,
        );
      } else {
        this.logger.warn(
          'Design planning unavailable — using the direct designer prompt. ' +
            '(Check the warning logged by the planner above for the exact reason.)',
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Design planning skipped (${message}).`);
    }

    let finalPrompt = designPlan
      ? this.promptBuilder.buildRendererPromptFromPlan(
          designPlan,
          userPrompt,
          promptContext,
        )
      : this.promptBuilder.buildFinalPrompt(
          userPrompt,
          styles,
          imageStyles,
          promptContext,
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
      generated = await this.pollinationsService.generatePostImage({
        prompt: finalPrompt,
      });
    } else {
      try {
        generated = await this.geminiService.generatePostImage({
          prompt: finalPrompt,
          imageBase64: subjectBase64,
          logoImage: logoBase64
            ? { base64: logoBase64, mimeType: logoMime }
            : undefined,
          referenceImages: await this.loadReferenceImages(imageStyles),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Gemini image generation failed (${message.slice(0, 200)}…). ` +
            'Falling back to Pollinations — the subject photo is NOT included in fallback designs. ' +
            'Enable billing on your Google AI Studio project for the full pipeline.',
        );
        usedProvider = 'pollinations';
        // Pollinations cannot see images, but it CAN follow the planner's
        // master description — a plan makes the free-engine fallback much
        // stronger too. Otherwise use the compact designer prompt.
        const planImagePrompt =
          designPlan && typeof designPlan.image_generation_prompt === 'string'
            ? designPlan.image_generation_prompt
            : null;
        finalPrompt = planImagePrompt
          ? `Photorealistic ${POST_SIZES[brief.postSize].aspect} social media post design. Follow this art direction precisely: ${planImagePrompt} Real product photography look, bold clear headline text, sharp focus, high detail, clean modern layout. No cartoon, no anime, no illustration, no animated style.`
          : this.promptBuilder.buildFinalPrompt(
              userPrompt,
              styles,
              imageStyles,
              {
                ...promptContext,
                engine: 'pollinations',
              },
            );
        this.logger.log(
          `Fallback prompt sent to Pollinations:\n${finalPrompt}`,
        );
        generated = await this.pollinationsService.generatePostImage({
          prompt: finalPrompt,
        });
      }
    }

    // 4. Persist DB row first (id needed for the file name), then the file.
    //    The category + design brief are stored so future requests can be
    //    handled dynamically and retrieval stays category-scoped.
    const post = await this.postsService.createPost({
      userPrompt,
      finalPrompt,
      userId,
      category,
      postSize: brief.postSize,
      outputType: brief.outputType,
      designBrief: {
        content: brief.content,
        colorScheme: brief.colorScheme,
        font: brief.font,
        designConcept: brief.designConcept,
        hasSubject: Boolean(subjectBase64),
        hasLogo: Boolean(logoBase64),
        plan: designPlan ?? undefined,
      },
    });
    // The extension follows the ACTUAL bytes: when the engine cannot emit
    // the requested format (e.g. Gemini always returns PNG), the file keeps
    // its real type and the response's `format` field reports it.
    const ext = generated.mimeType === 'image/png' ? 'png' : 'jpg';
    const fileName = `${post.id}.${ext}`;
    await mkdir(this.outputDir, { recursive: true });
    await writeFile(
      resolve(this.outputDir, fileName),
      Buffer.from(generated.imageBase64, 'base64'),
    );

    const imagePath = `generated-posts/${fileName}`;
    await this.postsService.postRepository.update(post.id, { imagePath });

    // 5. Image-side RAG write-back: embed the freshly generated post image
    //    with CLIP so future generations can retrieve it visually. It stays
    //    'generated' (not retrieved) until rated >= 4 — FeedbackService then
    //    flips it into the user's image-style pool.
    try {
      const clip = await this.imageEmbeddingsService.embedImage(
        Buffer.from(generated.imageBase64, 'base64'),
        fileName,
        generated.mimeType,
      );
      await this.postsService.imageEmbeddingRepository.insert({
        postId: post.id,
        imagePath,
        source: 'generated',
        model: clip.model,
        dims: clip.dimensions,
        embedding: clip.vector,
        styleMetadata: {
          engine: usedProvider,
          generatedAt: new Date().toISOString(),
          category: category ?? undefined,
          postSize: brief.postSize,
          outputType: brief.outputType,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Generated image was not added to the image-style pool (${message}).`,
      );
    }

    this.logger.log(
      `Generated post ${post.id} via ${usedProvider} (${imagePath})`,
    );

    return {
      id: post.id,
      imageUrl: `/${imagePath}`,
      userPrompt,
      finalPrompt,
      category,
      postSize: brief.postSize,
      outputType: brief.outputType,
      format: generated.mimeType,
      designBrief: post.designBrief,
      rating: null,
      engine: usedProvider,
      createdAt: post.createdAt,
    };
  }

  /**
   * Loads the retrieved reference images from `public/` as base64 payloads
   * for the Gemini call (top matches only; missing files are skipped so a
   * broken reference never blocks generation).
   */
  private async loadReferenceImages(
    imageStyles: RetrievedImageStyle[],
    limit = 2,
  ): Promise<Array<{ base64: string; mimeType: string }>> {
    const references: Array<{ base64: string; mimeType: string }> = [];
    for (const style of imageStyles.slice(0, limit)) {
      try {
        const buffer = await readFile(
          resolve(process.cwd(), 'public', style.imagePath),
        );
        references.push({
          base64: buffer.toString('base64'),
          mimeType: mimeFromImagePath(style.imagePath),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Reference image ${style.imagePath} could not be loaded (${message}).`,
        );
      }
    }
    return references;
  }
}
