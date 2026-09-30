import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { extname, resolve } from 'path';
import { randomUUID } from 'crypto';

import { UploadedFile, readFileBuffer } from '../common/upload/image-upload';
import { ImageProcessingService } from '../image-processing/image-processing.service';
import { PostsService, CreatePostInput } from '../posts/posts.service';
import { PostResponseDto } from './dto/post-response.dto';
import { GeneratePostDto } from './dto/generate-post.dto';
import { CreateGuidedPostDto } from './dto/create-guided-post.dto';
import {
  GeminiService,
  GeneratedImage,
  GeneratePostImageParams,
} from './gemini.service';
import { PollinationsService } from './providers/pollinations.service';
import { EmbeddingsService } from './rag/embeddings.service';
import {
  PromptBuilderService,
  DesignBriefContext,
} from './rag/prompt-builder.service';
import { RetrievedReference, RetrieverService } from './rag/retriever.service';
import { BillingService } from '../billing/billing.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BrandsService } from '../brands/brands.service';
import { Post } from '../posts/entities/post.entity';

/**
 * Orchestrates social media post generation:
 *
 * 1. Resolves brand DNA and credit balance.
 * 2. Processes uploaded product images and optional human model reference via the background-removal pipeline.
 * 3. RAG: retrieves high-performing past style references.
 * 4. Generates creative marketing copy and plans high-end visual design.
 * 5. Synthesizes 1 to 4 distinct design variants with Gemini (with automatic Pollinations fallback).
 * 6. Persists database records, stores assets under public/, and notifies the user.
 */
@Injectable()
export class PostGeneratorService {
  private readonly logger = new Logger(PostGeneratorService.name);

  private readonly outputDir = resolve(process.cwd(), 'public', 'generated-posts');
  private readonly uploadsDir = resolve(process.cwd(), 'public', 'uploads');

  constructor(
    private readonly imageProcessingService: ImageProcessingService,
    private readonly geminiService: GeminiService,
    private readonly pollinationsService: PollinationsService,
    private readonly postsService: PostsService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly retrieverService: RetrieverService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly billingService: BillingService,
    private readonly notificationsService: NotificationsService,
    private readonly brandsService: BrandsService,
  ) {}

  /** Which image engine to use — `IMAGE_PROVIDER` in `.env` (gemini | pollinations). */
  private get provider(): 'gemini' | 'pollinations' {
    return (process.env.IMAGE_PROVIDER || 'gemini') as 'gemini' | 'pollinations';
  }

  /**
   * Freeform post generation endpoint handler.
   */
  async generatePost(
    promptOrDto: GeneratePostDto | string,
    file?: UploadedFile,
    userId: string | null = null,
    logo?: UploadedFile,
  ): Promise<PostResponseDto> {
    const dto: GeneratePostDto =
      typeof promptOrDto === 'string'
        ? { prompt: promptOrDto }
        : promptOrDto;

    return this.executeGenerationPipeline(
      dto,
      file ? [file] : undefined,
      userId,
      logo,
    );
  }

  /**
   * Guided post creation endpoint handler with multi-image & human model support.
   */
  async generateGuidedPost(
    dto: CreateGuidedPostDto,
    fileOrFiles?: UploadedFile | UploadedFile[],
    userId: string | null = null,
    logo?: UploadedFile,
    modelFile?: UploadedFile,
  ): Promise<PostResponseDto> {
    const files = Array.isArray(fileOrFiles)
      ? fileOrFiles
      : fileOrFiles
        ? [fileOrFiles]
        : undefined;

    return this.executeGenerationPipeline(
      dto,
      files,
      userId,
      logo,
      modelFile,
    );
  }

  /**
   * Central generation pipeline handling credit billing, asset ingestion,
   * RAG retrieval, marketing copy, and multi-variant image generation.
   */
  private async executeGenerationPipeline(
    dto: CreateGuidedPostDto | GeneratePostDto,
    productFiles?: UploadedFile[],
    userId: string | null = null,
    logo?: UploadedFile,
    modelFile?: UploadedFile,
  ): Promise<PostResponseDto> {
    const variationsCount = Math.max(
      1,
      Math.min(4, Number(dto.variationsCount || dto.totalVariations || 1)),
    );
    const creditsCostPerVariant = 5;
    const totalCreditsCost = variationsCount * creditsCostPerVariant;

    // 1. Credit deduction for registered users
    if (userId) {
      await this.billingService.deductCredits(
        userId,
        totalCreditsCost,
        `AI Post Generation: ${dto.productName || dto.prompt || 'Campaign'} (${variationsCount} variant${variationsCount > 1 ? 's' : ''})`,
      );
    }

    try {
      await mkdir(this.outputDir, { recursive: true });
      await mkdir(this.uploadsDir, { recursive: true });

      // 2. Resolve Brand DNA profile if available
      let brandProfileId = dto.brandProfileId;
      let brandName = dto.brandName;
      let primaryColor = dto.primaryColor;
      let secondaryColor = dto.secondaryColor;
      let accentColor = dto.accentColor;
      let fontHeading = dto.fontHeading || dto.font;
      let fontBody = dto.fontBody;
      let tone = dto.tone;

      // Contact details for the artwork. Sanitised to plain phone/email shapes
      // so a scraped value can never smuggle instructions into the prompt.
      const contactEmail = sanitizeContactEmail(dto.contactEmail);
      const contactPhone = sanitizeContactPhone(dto.contactPhone);

      if (userId) {
        try {
          const userBrands = await this.brandsService.listUserBrands(userId);
          const activeBrand = brandProfileId
            ? userBrands.find((b) => b.id === brandProfileId)
            : userBrands.find((b) => b.isDefault) || userBrands[0];

          if (activeBrand) {
            brandProfileId = activeBrand.id;
            brandName = brandName || activeBrand.brandName;
            primaryColor = primaryColor || activeBrand.primaryColor;
            secondaryColor = secondaryColor || activeBrand.secondaryColor;
            accentColor = accentColor || activeBrand.accentColor;
            fontHeading = fontHeading || activeBrand.fontHeading;
            fontBody = fontBody || activeBrand.fontBody;
            tone = tone || activeBrand.tone;
          }
        } catch (err) {
          this.logger.warn(`Could not load brand profile: ${err}`);
        }
      }

      // 3. Save primary product original image to disk
      let originalImagePath: string | null = null;
      if (productFiles && productFiles.length > 0) {
        try {
          const primaryFile = productFiles[0];
          const origBuffer = await readFileBuffer(primaryFile);
          const ext = extname(primaryFile.originalname || '') || '.png';
          const origFileName = `orig-${randomUUID()}${ext}`;
          await writeFile(resolve(this.uploadsDir, origFileName), origBuffer);
          originalImagePath = `uploads/${origFileName}`;
        } catch (err) {
          this.logger.warn(`Failed to store original product image: ${err}`);
        }
      }

      // 4. Resolve the brand logo.
      //
      // Two sources, in priority order:
      //   a) an uploaded `logo` file, or
      //   b) `logoUrl` — the logo the backend scraped from the user's website.
      //      Without (b) a scraped logo would only ever be a preview and would
      //      never actually reach the image model, so we download and verify it
      //      here, server-side (no CORS, no hotlink protection).
      //
      // `showLogo === false` is the user saying "generate this logo-free", which
      // short-circuits both paths.
      let logoPath: string | null = null;
      let logoBase64: string | undefined;
      let logoMimeType: string | undefined;
      const showLogo = dto.showLogo !== false;

      if (!showLogo && logo) {
        this.logger.log('Logo suppressed by user preference (showLogo=false).');
      }

      if (showLogo && logo) {
        try {
          const logoBuffer = await readFileBuffer(logo);
          const ext = extname(logo.originalname || '') || '.png';
          const logoFileName = `logo-${randomUUID()}${ext}`;
          await writeFile(resolve(this.uploadsDir, logoFileName), logoBuffer);
          logoPath = `uploads/${logoFileName}`;
          logoBase64 = logoBuffer.toString('base64');
          logoMimeType = logo.mimetype || 'image/png';
        } catch (err) {
          this.logger.warn(`Failed to store logo image: ${err}`);
        }
      }

      if (showLogo && !logoBase64 && dto.logoUrl) {
        try {
          const fetched = await this.fetchRemoteLogo(dto.logoUrl);
          if (fetched) {
            const ext =
              fetched.mimeType === 'image/jpeg'
                ? '.jpg'
                : fetched.mimeType === 'image/webp'
                  ? '.webp'
                  : '.png';
            const logoFileName = `logo-${randomUUID()}${ext}`;
            await writeFile(resolve(this.uploadsDir, logoFileName), fetched.buffer);
            logoPath = `uploads/${logoFileName}`;
            logoBase64 = fetched.buffer.toString('base64');
            logoMimeType = fetched.mimeType;
            this.logger.log('Composited the logo scraped from the brand website.');
          }
        } catch (err) {
          this.logger.warn(`Failed to fetch remote brand logo: ${err}`);
        }
      }

      // 5. Process human model image if provided
      let modelImage: { base64: string; mimeType: string } | undefined;
      if (modelFile) {
        try {
          const modelBuffer = await readFileBuffer(modelFile);
          let processedModelBuffer = modelBuffer;
          try {
            const processed = await this.imageProcessingService.processImageWithStatus(
              modelFile,
              { model: 'u2net_human_seg' },
            );
            if (processed.buffer && processed.buffer.length > 0) {
              processedModelBuffer = processed.buffer;
            }
          } catch {
            // Keep original buffer if human segmentation is unavailable
          }
          modelImage = {
            base64: processedModelBuffer.toString('base64'),
            mimeType: modelFile.mimetype || 'image/png',
          };
          this.logger.log('Dedicated human model reference attached successfully.');
        } catch (err) {
          this.logger.warn(`Failed to process model reference image: ${err}`);
        }
      }

      // 6. Process product image(s) through background-removal pipeline
      const processedProducts: Array<{
        base64: string;
        mimeType: string;
        backgroundRemoved: boolean;
      }> = [];

      if (productFiles && productFiles.length > 0) {
        for (const pFile of productFiles) {
          try {
            if (this.provider === 'gemini') {
              const processed =
                await this.imageProcessingService.processImageWithStatus(pFile);
              processedProducts.push({
                base64: processed.buffer.toString('base64'),
                mimeType: pFile.mimetype || 'image/png',
                backgroundRemoved: processed.backgroundRemoved,
              });
            } else {
              const buf = await readFileBuffer(pFile);
              processedProducts.push({
                base64: buf.toString('base64'),
                mimeType: pFile.mimetype || 'image/png',
                backgroundRemoved: false,
              });
            }
          } catch (err) {
            this.logger.warn(`Error processing product image: ${err}`);
            const buf = await readFileBuffer(pFile);
            processedProducts.push({
              base64: buf.toString('base64'),
              mimeType: pFile.mimetype || 'image/png',
              backgroundRemoved: false,
            });
          }
        }
        this.logger.log(
          `Processed ${processedProducts.length} product reference image(s).`,
        );
      }

      // 7. RAG: build a rich semantic query, then retrieve references
      //    (text dossiers) and visual anchors (reference images).
      let styles: RetrievedReference[] = [];
      let visualRefs: Array<{ base64: string; mimeType: string }> = [];
      let visualRefTitles: string[] = [];
      const queryText = buildRetrievalQuery(dto);

      if (this.embeddingsService.isConfigured) {
        try {
          const queryEmbedding = await this.embeddingsService.embedText(queryText);
          const category = dto.category || dto.niche || null;
          const maxRefs = Number(process.env.RAG_MAX_REFERENCES ?? 7);

          styles = await this.retrieverService.retrieveStyleContext(
            userId,
            queryEmbedding,
            category,
            queryText,
            maxRefs,
          );

          // Visual anchors: the same ranking, restricted to entries that
          // actually have an image we can attach to the image model.
          const maxImages = Math.max(
            0,
            Math.min(4, Number(process.env.GEMINI_MAX_STYLE_REFS ?? 2)),
          );
          const visualCandidates =
            await this.retrieverService.retrieveVisualReferences(
              userId,
              queryEmbedding,
              category,
              queryText,
              maxImages,
            );

          for (const candidate of visualCandidates) {
            const loaded = await this.loadImageAsBase64(candidate.imagePath);
            if (loaded) {
              visualRefs.push(loaded);
              visualRefTitles.push(candidate.title);
            }
          }

          this.logger.log(
            `RAG retrieved ${styles.length} text reference(s) + ${visualRefs.length} image anchor(s) for "${queryText.slice(0, 80)}": ` +
              styles
                .map((s) => `${s.kind}/${s.source}(${(s.similarity * 100).toFixed(0)}%)`)
                .join(', '),
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `RAG style retrieval skipped (${message}). Proceeding without it.`,
          );
        }
      }

      // 8. Individual variant generator worker
      const generateVariant = async (variantIndex: number): Promise<Post> => {
        // Cycle the primary hero product among uploaded images so variants showcase different angles
        const primaryProduct =
          processedProducts.length > 0
            ? processedProducts[variantIndex % processedProducts.length]
            : undefined;

        // Generate tailored marketing copy for this variant angle
        let headline = dto.headline;
        let bodyCopy = dto.bodyCopy;
        let cta = dto.cta;

        if ((!headline || !bodyCopy) && this.geminiService.isConfigured) {
          try {
            const copy = await this.geminiService.generateMarketingCopy({
              productName: dto.productName || dto.prompt || 'Featured Product',
              platform: dto.platform || 'instagram',
              brandName,
              niche: dto.niche || dto.category,
              occasion: dto.occasion,
              style: dto.style,
              targetAudience: dto.targetAudience,
              keyMessage: dto.keyMessage,
              tone,
              language: dto.language,
              userHeadline: dto.headline,
              userBodyCopy: dto.bodyCopy,
              userCta: dto.cta,
              variationIndex: variantIndex,
              totalVariations: variationsCount,
            });
            headline = headline || copy.headline;
            bodyCopy = bodyCopy || copy.bodyCopy;
            cta = cta || copy.cta;
          } catch (err) {
            this.logger.warn(`Marketing copy generation fallback: ${err}`);
          }
        }

        const context: DesignBriefContext = {
          prompt: dto.prompt,
          productName: dto.productName,
          category: dto.category,
          niche: dto.niche,
          content: dto.content,
          colorScheme: dto.colorScheme,
          font: fontHeading,
          fontHeading,
          fontBody,
          postSize: dto.postSize,
          outputType: dto.outputType || 'png',
          platform: dto.platform || 'instagram',
          aspectRatio: dto.aspectRatio || '1:1',
          style: dto.style || 'luxury',
          occasion: dto.occasion,
          backgroundMode: dto.backgroundMode || 'ai_replace',
          headline,
          bodyCopy,
          targetAudience: dto.targetAudience,
          keyMessage: dto.keyMessage,
          cta,
          language: dto.language,
          tone: tone || 'confident',
          primaryColor,
          secondaryColor,
          accentColor,
          brandName,
          additionalInstructions: dto.additionalInstructions
            ? `${dto.additionalInstructions}. Variation ${variantIndex + 1} of ${variationsCount}.`
            : variationsCount > 1
              ? `Creative Variation ${variantIndex + 1} of ${variationsCount}. Provide an alternate dynamic composition, camera angle, and visual framing.`
              : undefined,
          hasSubjectImage: Boolean(primaryProduct?.base64),
          subjectImagesCount: processedProducts.length,
          hasModelImage: Boolean(modelImage?.base64),
          backgroundRemoved: primaryProduct?.backgroundRemoved ?? false,
          hasLogo: Boolean(logoBase64),
          // The user explicitly asked for a logo-free creative.
          showLogo,
          // Contact details the user chose to typeset on the artwork. Passing
          // them here promotes them to a whitelisted on-canvas string, which is
          // what lets the model render them without inventing anything else.
          contactEmail: contactEmail || undefined,
          contactPhone: contactPhone || undefined,
          contactPlacement: dto.contactPlacement || 'auto',
          referenceImageCount: visualRefs.length,
          referenceImageTitles: visualRefTitles,
          // The ONLY text allowed on the artwork. The user's idea/prompt is
          // deliberately NOT passed here — it is context, never copy.
          onImageText: dto.onImageText,
          onImageTextFont: dto.onImageTextFont,
          onImageTextPlacement: dto.onImageTextPlacement || 'auto',
          onImageTextColor: dto.onImageTextColor,
        };

        // Two-stage prompt planning
        let finalPrompt: string;
        let designBrief: Record<string, any> | null = null;
        let usedProvider: 'gemini' | 'pollinations' = this.provider;

        if (this.provider === 'gemini' && this.geminiService.isConfigured) {
          try {
            const plannerPrompt = this.promptBuilder.buildPlannerPrompt(
              context,
              styles,
            );
            const plan = await this.geminiService.planDesign(plannerPrompt);
            if (plan.image_generation_prompt) {
              designBrief = plan;
              finalPrompt = this.promptBuilder.buildRendererPromptFromPlan(
                plan.image_generation_prompt,
                context,
                styles,
              );
            } else {
              finalPrompt = this.promptBuilder.buildFinalPrompt(
                context,
                styles,
                'gemini',
              );
            }
          } catch {
            finalPrompt = this.promptBuilder.buildFinalPrompt(
              context,
              styles,
              'gemini',
            );
          }
        } else {
          usedProvider = 'pollinations';
          finalPrompt = this.promptBuilder.buildFinalPrompt(
            context,
            styles,
            'pollinations',
          );
        }

        // Image synthesis
        let generated: GeneratedImage;
        if (usedProvider === 'gemini') {
          try {
            const imageParams: GeneratePostImageParams = {
              prompt: finalPrompt,
              imageBase64: primaryProduct?.base64,
              imageMimeType: primaryProduct?.mimeType || 'image/png',
              images: processedProducts.map((p) => ({
                base64: p.base64,
                mimeType: p.mimeType,
              })),
              modelImage: modelImage
                ? { base64: modelImage.base64, mimeType: modelImage.mimeType }
                : undefined,
              logoBase64,
              logoMimeType: logoMimeType || logo?.mimetype || 'image/png',
              referenceImages: visualRefs,
              aspectRatio: dto.aspectRatio || '1:1',
              postSize: dto.postSize,
            };
            generated = await this.geminiService.generatePostImage(imageParams);
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            this.logger.warn(
              `Gemini image generation failed (${message.slice(0, 200)}...). Falling back to Pollinations.`,
            );
            usedProvider = 'pollinations';
            finalPrompt = this.promptBuilder.buildCompactImagePrompt(
              context,
              styles,
            );
            generated = await this.pollinationsService.generatePostImage({
              prompt: finalPrompt,
              aspectRatio: dto.aspectRatio || '1:1',
              postSize: dto.postSize,
            });
          }
        } else {
          generated = await this.pollinationsService.generatePostImage({
            prompt: finalPrompt,
            aspectRatio: dto.aspectRatio || '1:1',
            postSize: dto.postSize,
          });
        }

        // Persist DB row
        const postInput: CreatePostInput = {
          userId,
          brandProfileId,
          title: dto.productName
            ? `${dto.productName}${variationsCount > 1 ? ` — Variant ${variantIndex + 1}` : ''}`
            : dto.headline || 'Campaign Post',
          productName: dto.productName || null,
          niche: dto.niche || dto.category || null,
          platform: dto.platform || 'instagram',
          aspectRatio: dto.aspectRatio || '1:1',
          style: dto.style || 'luxury',
          occasion: dto.occasion || null,
          backgroundMode: dto.backgroundMode || 'ai_replace',
          headline: headline || null,
          bodyCopy: bodyCopy || null,
          category: dto.category || null,
          content: dto.content || cta || null,
          colorScheme: dto.colorScheme || null,
          font: fontHeading || null,
          onImageText: dto.onImageText || null,
          onImageTextFont: dto.onImageTextFont || null,
          onImageTextPlacement: dto.onImageTextPlacement || 'auto',
          onImageTextColor: dto.onImageTextColor || null,
          postSize: dto.postSize || null,
          outputType: dto.outputType || 'png',
          logoPath,
          designBrief,
          userPrompt: queryText,
          finalPrompt,
          originalImagePath,
          engine: usedProvider,
          status: 'completed',
        };

        const post = await this.postsService.createPost(postInput);
        const ext = generated.mimeType === 'image/jpeg' ? 'jpg' : 'png';
        const fileName = `${post.id}.${ext}`;
        await writeFile(
          resolve(this.outputDir, fileName),
          Buffer.from(generated.imageBase64, 'base64'),
        );

        const imagePath = `generated-posts/${fileName}`;
        await this.postsService.postRepository.update(post.id, { imagePath });
        post.imagePath = imagePath;

        this.logger.log(
          `Generated variant ${variantIndex + 1}/${variationsCount} (Post ${post.id}) via ${usedProvider}`,
        );

        // Auto-index into the RAG corpus so the knowledge base grows with
        // every generation. A failure here must never fail the request.
        await this.indexPostForRetrieval(post).catch(() => {});

        return post;
      };

      // 9. Execute variants concurrently via Promise.allSettled
      const variantTasks = Array.from({ length: variationsCount }, (_, idx) =>
        generateVariant(idx),
      );
      const results = await Promise.allSettled(variantTasks);

      const successfulPosts: Post[] = [];
      const errors: string[] = [];

      for (let i = 0; i < results.length; i++) {
        const res = results[i];
        if (res.status === 'fulfilled') {
          successfulPosts.push(res.value);
        } else {
          const errMsg = res.reason?.message || String(res.reason);
          this.logger.error(`Variant ${i + 1} generation failed: ${errMsg}`);
          errors.push(errMsg);
        }
      }

      if (successfulPosts.length === 0) {
        if (userId) {
          await this.billingService.refundCredits(
            userId,
            totalCreditsCost,
            'Post generation failed',
          );
        }
        throw new InternalServerErrorException(
          `Failed to generate posts: ${errors.join(', ')}`,
        );
      }

      // Partial refund if some requested variants failed
      if (userId && successfulPosts.length < variationsCount) {
        const failedCount = variationsCount - successfulPosts.length;
        const refundAmount = failedCount * creditsCostPerVariant;
        await this.billingService.refundCredits(
          userId,
          refundAmount,
          `Partial refund for ${failedCount} failed post variant(s)`,
        );
      }

      // Notify user on success
      if (userId) {
        await this.notificationsService
          .create(
            userId,
            'Post Ready! 🎨',
            `Your ${dto.productName || 'social'} post (${successfulPosts.length} variant${successfulPosts.length > 1 ? 's' : ''}) is ready.`,
            'post_created',
          )
          .catch(() => {});
      }

      // 10. Clean variants to prevent circular structure errors during JSON serialization
      const cleanVariants = successfulPosts.map((p) => {
        const item = this.formatResponse(p);
        delete item.variants;
        return item;
      });

      const primaryResponse: PostResponseDto = {
        ...cleanVariants[0],
        variants: cleanVariants,
      };

      return primaryResponse;
    } catch (err: any) {
      if (userId && !(err instanceof InternalServerErrorException)) {
        await this.billingService.refundCredits(
          userId,
          totalCreditsCost,
          'Post generation error',
        );
      }
      throw err;
    }
  }

  /**
   * PROMPT LAB — builds the real planner prompt, runs the real RAG
   * retrieval, and returns everything alongside the composed final prompt
   * plus a synthetic plan, so the Stage-2 block layout can be inspected
   * without calling the image model or spending a credit.
   */
  async previewPrompts(
    dto: CreateGuidedPostDto,
    userId: string | null,
  ): Promise<Record<string, unknown>> {
    const queryText = buildRetrievalQuery(dto);

    let references: RetrievedReference[] = [];
    let visualRefs: Array<{ id: string; title: string; imagePath: string; similarity: number }> = [];
    let retrievalError: string | null = null;

    if (this.embeddingsService.isConfigured) {
      try {
        const queryEmbedding = await this.embeddingsService.embedText(queryText);
        references = await this.retrieverService.retrieveStyleContext(
          userId,
          queryEmbedding,
          dto.category || dto.niche || null,
          queryText,
          Number(process.env.RAG_MAX_REFERENCES ?? 7),
        );
        const candidates = await this.retrieverService.retrieveVisualReferences(
          userId,
          queryEmbedding,
          dto.category || dto.niche || null,
          queryText,
          Math.max(0, Math.min(4, Number(process.env.GEMINI_MAX_STYLE_REFS ?? 2))),
        );
        visualRefs = candidates.map((c) => ({
          id: c.id,
          title: c.title,
          imagePath: c.imagePath,
          similarity: c.similarity,
        }));
      } catch (error) {
        retrievalError =
          error instanceof Error ? error.message : String(error);
      }
    }

    const context: DesignBriefContext = {
      prompt: dto.prompt,
      productName: dto.productName,
      category: dto.category,
      niche: dto.niche,
      content: dto.content,
      colorScheme: dto.colorScheme,
      font: dto.fontHeading || dto.font,
      fontHeading: dto.fontHeading,
      fontBody: dto.fontBody,
      postSize: dto.postSize,
      outputType: dto.outputType || 'png',
      platform: dto.platform || 'instagram',
      aspectRatio: dto.aspectRatio || '1:1',
      style: dto.style || 'luxury',
      occasion: dto.occasion,
      backgroundMode: dto.backgroundMode || 'ai_replace',
      headline: dto.headline,
      bodyCopy: dto.bodyCopy,
      targetAudience: dto.targetAudience,
      keyMessage: dto.keyMessage,
      cta: dto.cta,
      language: dto.language,
      tone: dto.tone,
      primaryColor: dto.primaryColor,
      secondaryColor: dto.secondaryColor,
      accentColor: dto.accentColor,
      brandColors: dto.brandColors,
      layoutPreference: dto.layoutPreference,
      brandName: dto.brandName,
      additionalInstructions: dto.additionalInstructions,
      hasSubjectImage: false,
      subjectImagesCount: 0,
      hasModelImage: false,
      hasLogo: false,
      referenceImageCount: visualRefs.length,
      referenceImageTitles: visualRefs.map((v) => v.title),
      onImageText: dto.onImageText,
      onImageTextFont: dto.onImageTextFont,
      onImageTextPlacement: dto.onImageTextPlacement || 'auto',
      onImageTextColor: dto.onImageTextColor,
    };

    const plannerPrompt = this.promptBuilder.buildPlannerPrompt(context, references);

    // A stand-in for the planner's `image_generation_prompt` so the Stage-2
    // block structure is fully visible in the preview.
    const placeholderPlan =
      'A single hero composition in a soft-sculpting studio environment, shot on medium-format optics with a large softbox key and a gentle rim kicker separating the subject from a warm neutral background, brand palette locked to the supplied colours, headline anchored in the upper third and a compact CTA pill below it, shallow cinematic depth of field with balanced negative space.';

    return {
      retrievalQuery: queryText,
      retrievalError,
      embeddingsConfigured: this.embeddingsService.isConfigured,
      referencesRetrieved: references.length,
      visualReferences: visualRefs,
      corpus: await this.retrieverService.getCorpusStats(userId),
      references: references.map((r) => ({
        id: r.id,
        kind: r.kind,
        source: r.source,
        title: r.title,
        category: r.category,
        similarity: Number(r.similarity.toFixed(4)),
        score: Number(r.score.toFixed(4)),
        rating: r.rating,
        hasImage: r.hasImage,
      })),
      plannerPrompt,
      finalPrompt: this.promptBuilder.buildRendererPromptFromPlan(
        placeholderPlan,
        context,
        references,
      ),
      fallbackPrompt: this.promptBuilder.buildFinalPrompt(
        context,
        references,
        'gemini',
      ),
      pollinationsPrompt: this.promptBuilder.buildCompactImagePrompt(
        context,
        references,
      ),
    };
  }

  /* ================================================================== */
  /*  IMAGE EDITING                                                      */
  /* ================================================================== */

  /**
   * Edits an already-generated creative.
   *
   * The user describes what they want changed; that instruction is combined
   * with the original creative's own settings, sent to Gemini together with
   * the existing image, and the model returns a revised image. The result is
   * stored as a NEW post row linked back to its parent, so the gallery keeps
   * the edit history and the original is never destroyed.
   *
   * Only Gemini can do a true image edit (Pollinations is text-to-image only),
   * so this path requires a configured Gemini key.
   */
  async editPost(
    postId: string,
    instructions: string,
    userId: string | null,
  ): Promise<PostResponseDto> {
    const changeRequest = (instructions || '').trim();
    if (changeRequest.length < 3) {
      throw new BadRequestException(
        'Describe the changes you want, for example "make the background darker and warmer".',
      );
    }

    const original = await this.postsService.findPostById(postId);
    if (!original) {
      throw new NotFoundException(`Post ${postId} not found.`);
    }
    if (!original.imagePath) {
      throw new BadRequestException(
        'This post has no generated image, so it cannot be edited.',
      );
    }
    if (!this.geminiService.isConfigured) {
      throw new ServiceUnavailableException(
        'Image editing needs Gemini: set GEMINI_API_KEY in Backend/.env',
      );
    }

    // An edit costs less than a fresh generation but is still metered.
    const editCredits = Math.max(
      1,
      Math.min(5, Number(process.env.EDIT_CREDIT_COST ?? 2)),
    );
    if (userId) {
      await this.billingService.deductCredits(
        userId,
        editCredits,
        `AI Image Edit: ${original.title || original.productName || 'Post'}`,
      );
    }

    try {
      await mkdir(this.outputDir, { recursive: true });

      const source = await this.loadImageAsBase64(original.imagePath);
      if (!source) {
        throw new BadRequestException(
          'The original image file could not be read, so it cannot be edited.',
        );
      }

      // Rebuild the original creative's design context so the edit prompt
      // keeps the same typography contract (no prompt leakage on edit).
      const brief = (original.designBrief || {}) as Record<string, any>;
      const context: DesignBriefContext = {
        aspectRatio: original.aspectRatio || '1:1',
        postSize: original.postSize || undefined,
        style: original.style || undefined,
        platform: original.platform || undefined,
        brandName: original.productName || undefined,
        colorScheme: original.colorScheme || undefined,
        fontHeading: original.onImageTextFont || original.font || undefined,
        onImageText: original.onImageText ?? undefined,
        onImageTextFont: original.onImageTextFont ?? undefined,
        onImageTextPlacement: original.onImageTextPlacement || 'auto',
        onImageTextColor: original.onImageTextColor ?? undefined,
        hasSubjectImage: Boolean(original.originalImagePath),
        hasLogo: Boolean(original.logoPath),
      };

      const editPrompt = this.promptBuilder.buildEditPrompt(
        changeRequest,
        context,
      );

      const generated = await this.geminiService.editPostImage({
        sourceImageBase64: source.base64,
        sourceImageMimeType: source.mimeType,
        prompt: editPrompt,
        aspectRatio: original.aspectRatio || '1:1',
        postSize: original.postSize || undefined,
      });

      const edited = await this.postsService.createPost({
        userId,
        brandProfileId: original.brandProfileId,
        title: original.title
          ? `${original.title} — Edit ${(original.editCount ?? 0) + 1}`
          : 'Edited Post',
        productName: original.productName,
        niche: original.niche,
        platform: original.platform,
        aspectRatio: original.aspectRatio,
        style: original.style,
        occasion: original.occasion,
        backgroundMode: original.backgroundMode,
        headline: original.headline,
        bodyCopy: original.bodyCopy,
        category: original.category,
        content: original.content,
        colorScheme: original.colorScheme,
        font: original.font,
        onImageText: original.onImageText,
        onImageTextFont: original.onImageTextFont,
        onImageTextPlacement: original.onImageTextPlacement,
        onImageTextColor: original.onImageTextColor,
        parentPostId: original.id,
        editCount: (original.editCount ?? 0) + 1,
        postSize: original.postSize,
        outputType: original.outputType,
        logoPath: original.logoPath,
        designBrief: {
          ...brief,
          edit: {
            instructions: changeRequest.slice(0, 600),
            parentPostId: original.id,
            editedAt: new Date().toISOString(),
          },
        },
        userPrompt: `Edit request: ${changeRequest.slice(0, 400)}`,
        finalPrompt: editPrompt,
        originalImagePath: original.originalImagePath,
        engine: 'gemini',
        status: 'completed',
      });

      const ext = generated.mimeType === 'image/jpeg' ? 'jpg' : 'png';
      const fileName = `${edited.id}.${ext}`;
      await writeFile(
        resolve(this.outputDir, fileName),
        Buffer.from(generated.imageBase64, 'base64'),
      );
      const imagePath = `generated-posts/${fileName}`;
      await this.postsService.postRepository.update(edited.id, { imagePath });
      edited.imagePath = imagePath;

      this.logger.log(
        `Edited post ${original.id} -> ${edited.id} (${changeRequest.slice(0, 80)})`,
      );

      await this.indexPostForRetrieval(edited).catch(() => {});

      if (userId) {
        await this.notificationsService
          .create(
            userId,
            'Edit Applied ✨',
            'Your requested changes were applied to the creative.',
            'post_created',
          )
          .catch(() => {});
      }

      return this.formatResponse(edited);
    } catch (err) {
      if (userId) {
        await this.billingService.refundCredits(
          userId,
          editCredits,
          'Image edit failed',
        );
      }
      throw err;
    }
  }

  /* ================================================================== */
  /*  APPROVE → VECTOR KNOWLEDGE BASE                                     */
  /* ================================================================== */

  /**
   * Marks a creative as approved by the user and promotes it into the RAG
   * knowledge base.
   *
   * Approving is the explicit "this is exactly what I wanted" signal, so it is
   * treated as a first-class quality marker: the post is (re-)embedded with a
   * rich, style-focused description and its personal-pool entry is refreshed so
   * future generations on this account retrieve it — both as text context and
   * as a visual style anchor when it has an image on disk.
   *
   * Un-approving removes the post from the personal pool again.
   */
  async approvePost(
    postId: string,
    isApproved: boolean,
    userId: string | null,
  ): Promise<PostResponseDto> {
    const post = await this.postsService.findPostById(postId);
    if (!post) {
      throw new NotFoundException(`Post ${postId} not found.`);
    }
    if (post.userId && userId && post.userId !== userId) {
      throw new ForbiddenException(
        'You can only approve your own generated posts.',
      );
    }

    const updated = await this.postsService.setApproved(postId, isApproved);
    if (!updated) {
      throw new NotFoundException(`Post ${postId} not found.`);
    }

    if (isApproved) {
      await this.promoteToKnowledgeBase(updated, userId ?? updated.userId);
    } else {
      await this.removeFromPersonalPool(postId);
    }

    return this.formatResponse(updated);
  }

  /**
   * Embeds an approved creative and marks it as part of the user's personal
   * style pool so the retriever can serve it on the next generation.
   */
  private async promoteToKnowledgeBase(
    post: Post,
    userId: string | null,
  ): Promise<void> {
    if (!this.embeddingsService.isConfigured) {
      this.logger.warn(
        `Post ${post.id} approved, but embeddings are not configured — it cannot be indexed yet.`,
      );
      return;
    }

    // A style-focused description retrieves far better than the raw prompt,
    // which is dominated by rendering instructions.
    const parts = [
      post.userPrompt,
      `Style: ${post.style || 'n/a'}`,
      `Occasion: ${post.occasion || 'n/a'}`,
      `Category: ${post.category || post.niche || 'n/a'}`,
      post.onImageText ? `On-image text: ${post.onImageText}` : 'No on-image text',
      post.onImageTextFont ? `On-image font: ${post.onImageTextFont}` : '',
      post.colorScheme ? `Palette: ${post.colorScheme}` : '',
      'User-approved creative — study its art direction, composition and finish.',
    ]
      .filter(Boolean)
      .join(' — ');

    try {
      const embedding = await this.embeddingsService.embedText(parts);
      const embedRepo = this.postsService.embeddingRepository;
      const existing = await embedRepo.findOne({
        where: { postId: post.id, source: 'user' },
      });
      const category =
        post.category || (post.niche ? post.niche.toLowerCase() : null);
      const styleMetadata = {
        approvedAt: new Date().toISOString(),
        approvedByUser: true,
        rating: post.rating ?? 5,
        onImageText: post.onImageText ?? '',
      };

      if (existing) {
        existing.contentText = parts;
        existing.embedding = embedding;
        existing.category = category;
        existing.styleMetadata = styleMetadata;
        await embedRepo.save(existing);
      } else {
        await embedRepo.insert({
          postId: post.id,
          contentText: parts,
          source: 'user',
          category,
          embedding,
          styleMetadata,
        });
      }
      this.retrieverService.invalidateCache();
      this.logger.log(
        `Post ${post.id} approved by user ${userId ?? 'unknown'} — promoted to the personal RAG knowledge base.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to index approved post ${post.id}: ${message}`);
    }
  }

  /** Removes a post's personal-pool embedding when approval is withdrawn. */
  private async removeFromPersonalPool(postId: string): Promise<void> {
    try {
      const embedRepo = this.postsService.embeddingRepository;
      const existing = await embedRepo.findOne({
        where: { postId, source: 'user' },
      });
      if (existing) {
        await embedRepo.remove(existing);
        this.retrieverService.invalidateCache();
        this.logger.log(
          `Post ${postId} approval withdrawn — removed from the personal RAG pool.`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to remove post ${postId} from the personal RAG pool: ${message}`,
      );
    }
  }

  /**
   * Indexes a freshly generated post into the RAG corpus immediately.
   *
   * Historically a post only entered the knowledge base once the user rated it
   * 4★ or higher, which meant the corpus stayed tiny. Now every generation is
   * embedded up-front; `FeedbackService` re-embeds and re-scores it when a
   * rating arrives, and the retriever only serves rated posts from the personal
   * pool — so unrated entries are stored for free but never pollute prompts.
   */
  private async indexPostForRetrieval(post: Post): Promise<void> {
    if (!this.embeddingsService.isConfigured) {
      return;
    }

    const contentText = post.finalPrompt
      ? `${post.userPrompt} — ${post.finalPrompt}`
      : post.userPrompt;
    if (!contentText?.trim()) {
      return;
    }

    try {
      const embedding = await this.embeddingsService.embedText(contentText);
      const embedRepo = this.postsService.embeddingRepository;
      const existing = await embedRepo.findOne({
        where: { postId: post.id, source: 'user' },
      });
      const category =
        post.category || (post.niche ? post.niche.toLowerCase() : null);

      if (existing) {
        existing.contentText = contentText;
        existing.embedding = embedding;
        existing.category = category;
        await embedRepo.save(existing);
      } else {
        await embedRepo.insert({
          postId: post.id,
          contentText,
          source: 'user',
          category,
          embedding,
          styleMetadata: { autoIndexed: true, at: new Date().toISOString() },
        });
      }
      this.retrieverService.invalidateCache();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Auto-indexing post ${post.id} failed: ${message}`);
    }
  }

  /**
   * Reads a stored image from `Backend/public` and returns it base64-encoded
   * with its MIME type, ready to hand to the image model as an attachment.
   * Returns `null` when the file is missing or unreadable so a single broken
   * reference can never fail a whole generation.
   */
  private async loadImageAsBase64(
    relativePath: string,
  ): Promise<{ base64: string; mimeType: string } | null> {
    try {
      const buffer = await readFile(resolve(process.cwd(), 'public', relativePath));
      if (!buffer || buffer.length === 0) {
        return null;
      }
      const ext = (relativePath.split('.').pop() || '').toLowerCase();
      const mimeType =
        ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      return { base64: buffer.toString('base64'), mimeType };
    } catch {
      return null;
    }
  }
/**
   * Downloads a brand logo from an absolute remote URL so it can be composited
   * by the image model.
   *
   * This is what makes a *scraped* logo usable: the browser cannot hand us the
   * bytes of a cross-origin image, so a logo found on the user's website would
   * otherwise be a preview that never reaches generation. Fetching it here also
   * sidesteps CORS and hotlink protection on the brand's CDN.
   *
   * Returns null when the URL is not an http(s) URL, is not a raster image the
   * model can composite (SVG/ICO), or is implausibly small/large.
   */
  private async fetchRemoteLogo(
    url: string,
  ): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const MAX_LOGO_BYTES = 5 * 1024 * 1024;
    const MIN_LOGO_BYTES = 120;

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return null;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const response = await fetch(parsed.href, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8',
          Referer: `${parsed.protocol}//${parsed.host}/`,
        },
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timeoutId);

      if (!response.ok) return null;

      const mimeType = (response.headers.get('content-type') || '')
        .split(';')[0]
        .trim()
        .toLowerCase();
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(mimeType)) {
        return null;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < MIN_LOGO_BYTES || buffer.length > MAX_LOGO_BYTES) {
        return null;
      }

      return { buffer, mimeType };
    } catch (err: any) {
      this.logger.warn(`Remote logo fetch failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Formats a database Post entity into the uniform client-facing PostResponseDto.
   */
  formatResponse(post: Post): PostResponseDto {
    return {
      id: post.id,
      imageUrl: post.imagePath ? `/${post.imagePath}` : null,
      originalImageUrl: post.originalImagePath
        ? `/${post.originalImagePath}`
        : null,
      userPrompt: post.userPrompt,
      finalPrompt: post.finalPrompt,
      title: post.title,
      productName: post.productName,
      niche: post.niche,
      platform: post.platform,
      aspectRatio: post.aspectRatio,
      style: post.style,
      occasion: post.occasion,
      backgroundMode: post.backgroundMode,
      headline: post.headline,
      bodyCopy: post.bodyCopy,
      cta: (post.designBrief as any)?.cta || post.content || null,
      category: post.category,
      content: post.content,
      colorScheme: post.colorScheme,
      font: post.font,
      onImageText: post.onImageText ?? null,
      onImageTextFont: post.onImageTextFont ?? null,
      onImageTextPlacement: post.onImageTextPlacement || 'auto',
      onImageTextColor: post.onImageTextColor ?? null,
      postSize: post.postSize,
      outputType: post.outputType,
      format: post.outputType || 'png',
      logoUrl: post.logoPath ? `/${post.logoPath}` : null,
      designBrief: post.designBrief,
      rating: post.rating,
      isFavorite: post.isFavorite,
      isApproved: post.isApproved ?? false,
      approvedAt: post.approvedAt ?? null,
      parentPostId: post.parentPostId ?? null,
      editCount: post.editCount ?? 0,
      engine: post.engine,
      status: post.status,
      createdAt: post.createdAt,
    };
  }
}

/* ══════════════════════════════════════════════════════════════════════════
 * CONTACT DETAIL SANITIZERS
 *
 * Contact values can originate from a scraped website, so they are untrusted
 * input. Both helpers reduce the value to a strictly-shaped token — nothing but
 * the characters a real phone number or email address can contain — which makes
 * prompt-injection through this field impossible and also gives the image model
 * an unambiguous string to reproduce character-for-character.
 * ══════════════════════════════════════════════════════════════════════════ */

/**
 * Normalises a contact email to `local@domain.tld`, or returns null.
 * Rejects anything with whitespace, quotes or extra `@` signs.
 */
export function sanitizeContactEmail(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = String(value).trim().toLowerCase();
  if (trimmed.length > 160) return null;
  const match = trimmed.match(
    /^[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/,
  );
  return match ? match[0] : null;
}

/**
 * Normalises a contact phone number to digits plus the few separators humans
 * expect (spaces, dashes, dots and a single leading `+`).
 */
export function sanitizeContactPhone(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (trimmed.length > 60) return null;

  const hasPlus = trimmed.startsWith('+');
  // Keep only digits and human separators — this drops letters, quotes,
  // semicolons and every other prompt-injection vector.
  const cleaned = trimmed.replace(/[^\d\s().-]/g, '').replace(/\s+/g, ' ').trim();
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return null;

  return hasPlus ? `+${cleaned}` : cleaned;
}

/**
 * ════════════════════════════════════════════════════════════════════════
 *  RAG QUERY CONSTRUCTION
 * ════════════════════════════════════════════════════════════════════════
 *
 *  The single biggest lever on retrieval quality is what you embed. Embedding
 *  only `dto.prompt` means a bare "50% off" query can accidentally match a
 *  wildly different campaign that merely mentions numbers.
 *
 *  Instead we build a compact, natural-language *design brief* out of every
 *  field the user supplied. This gives the embedding model far more semantic
 *  surface to work with, so "minimal studio product launch" pulls the studio
 *  reference and not a festival post that merely shares a word.
 *
 *  It is stored as the post's `userPrompt` too, so the gallery shows a useful
 *  summary instead of a raw fragment.
 * ════════════════════════════════════════════════════════════════════════
 */
function buildRetrievalQuery(dto: GeneratePostDto | CreateGuidedPostDto): string {
  const parts: string[] = [];

  const concept = (dto.prompt || '').trim();
  const product = (dto.productName || '').trim();
  if (concept && product) {
    parts.push(`${product}: ${concept}`);
  } else if (concept || product) {
    parts.push(concept || product);
  }

  const category = (dto.category || dto.niche || '').trim();
  if (category) parts.push(`industry: ${category}`);

  const occasion = (dto.occasion || '').trim();
  if (occasion) parts.push(`campaign type: ${occasion}`);

  const style = (dto.style || '').trim();
  if (style) parts.push(`design style: ${style}`);

  const platform = (dto.platform || '').trim();
  if (platform) parts.push(`platform: ${platform}`);

  const background = (dto.backgroundMode || '').trim();
  if (background && background !== 'ai_replace') {
    parts.push(`background: ${background}`);
  }

  const audience = (dto.targetAudience || '').trim();
  if (audience) parts.push(`audience: ${audience}`);

  const message = (dto.keyMessage || dto.headline || '').trim();
  if (message) parts.push(`message: ${message}`);

  const brandColors = (dto as CreateGuidedPostDto).brandColors;
  const palette =
    brandColors && brandColors.length > 0
      ? brandColors.join(', ')
      : [dto.primaryColor, dto.secondaryColor, dto.accentColor]
          .filter(Boolean)
          .join(', ');
  if (palette) parts.push(`palette: ${palette}`);

  const layout = (dto.layoutPreference || '').trim();
  if (layout) parts.push(`layout: ${layout}`);

  const extras = (dto.additionalInstructions || '').trim();
  if (extras) parts.push(extras);

  return parts.join('. ').slice(0, 1200) || 'general commercial social media campaign';
}

