import { Injectable, Logger } from '@nestjs/common';
import { mkdir, writeFile } from 'fs/promises';
import { resolve } from 'path';

import { BillingService } from '../billing/billing.service';
import { BrandsService } from '../brands/brands.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UploadedFile } from '../common/upload/image-upload';
import { ImageProcessingService } from '../image-processing/image-processing.service';
import { Post } from '../posts/entities/post.entity';
import { PostsService } from '../posts/posts.service';
import { CreateGuidedPostDto } from './dto/create-guided-post.dto';
import { GeneratePostDto } from './dto/generate-post.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { GeminiService } from './gemini.service';
import type { GeneratedImage } from './gemini.service';
import { PollinationsService } from './providers/pollinations.service';
import { EmbeddingsService } from './rag/embeddings.service';
import { PromptBuilderService } from './rag/prompt-builder.service';
import { RetrievedStyle, RetrieverService } from './rag/retriever.service';

/**
 * Orchestrates post generation:
 * - Guided generation (art director prompt synthesis, background styling, aspect ratio)
 * - RAG freeform generation
 * - Credit deduction with automatic refund on failure
 * - Brand profile integration
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
    private readonly billingService: BillingService,
    private readonly brandsService: BrandsService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly retrieverService: RetrieverService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly notifService: NotificationsService,
  ) {}

  /** Which image engine to use — `IMAGE_PROVIDER` in `.env` (gemini | pollinations). */
  private get provider(): 'gemini' | 'pollinations' {
    return (process.env.IMAGE_PROVIDER || 'gemini') as
      | 'gemini'
      | 'pollinations';
  }

  /**
   * Generates one designer-style post (Freeform prompt or full DTO).
   */
  async generatePost(
    promptOrDto: string | GeneratePostDto,
    file?: UploadedFile,
    userId: string | null = null,
    logo?: UploadedFile,
  ): Promise<PostResponseDto> {
    const dto: GeneratePostDto =
      typeof promptOrDto === 'string' ? { prompt: promptOrDto } : promptOrDto;
    return this.executeGenerationPipeline(dto, file, logo, userId);
  }

  /**
   * Generates a designer post from guided selections and creative brief.
   */
  async generateGuidedPost(
    dto: CreateGuidedPostDto,
    file?: UploadedFile,
    userId: string | null = null,
    logo?: UploadedFile,
  ): Promise<PostResponseDto> {
    return this.executeGenerationPipeline(dto, file, logo, userId);
  }

  /**
   * Unified Generation Pipeline:
   * 1. Credit check & deduction
   * 2. Pure Node.js background removal for subject photo
   * 3. Logo file processing
   * 4. Brand DNA lookup
   * 5. Category-scoped RAG style retrieval
   * 6. Two-stage prompting (Gemini design planning pass -> image render prompt)
   * 7. Image generation (Gemini image model image-first with Pollinations fallback)
   * 8. Postgres persistence + file storage
   */
  private async executeGenerationPipeline(
    dto: GeneratePostDto | CreateGuidedPostDto,
    file?: UploadedFile,
    logo?: UploadedFile,
    userId: string | null = null,
  ): Promise<PostResponseDto> {
    const promptTopic = dto.prompt || dto.productName || 'custom post';
    if (userId) {
      await this.billingService.deductCredits(
        userId,
        5,
        `Generated post: ${promptTopic.slice(0, 30)}`,
      );
    }

    try {
      // 1. Fetch Brand DNA if brandProfileId is specified
      let brandColors: string[] = [];
      let brandTone: string | undefined = dto.tone;
      let fontHeading: string | undefined = dto.fontHeading;
      let fontBody: string | undefined = dto.fontBody;

      if (dto.primaryColor) brandColors.push(dto.primaryColor);
      if (dto.secondaryColor) brandColors.push(dto.secondaryColor);
      if (dto.accentColor) brandColors.push(dto.accentColor);

      let resolvedBrandName = dto.brandName;
      if (dto.brandProfileId && userId) {
        try {
          const brand = await this.brandsService.getBrandById(
            userId,
            dto.brandProfileId,
          );
          if (brand) {
            if (!resolvedBrandName) resolvedBrandName = brand.brandName;
            if (!brandColors.length) {
              brandColors = [
                brand.primaryColor,
                brand.secondaryColor,
                brand.accentColor,
              ].filter(Boolean);
            }
            if (!brandTone) brandTone = brand.tone;
            if (!fontHeading) fontHeading = brand.fontHeading;
            if (!fontBody) fontBody = brand.fontBody;
          }
        } catch (e) {
          this.logger.warn(`Brand lookup skipped: ${e}`);
        }
      }

      // 2. Subject hero image processing (Pure Node.js background removal)
      let originalImagePath: string | null = null;
      let subjectBase64: string | undefined;
      let backgroundRemoved = false;

      if (file && file.buffer) {
        const uploadsDir = resolve(process.cwd(), 'public', 'uploads');
        await mkdir(uploadsDir, { recursive: true });
        const origExt = file.mimetype?.includes('png')
          ? 'png'
          : file.mimetype?.includes('webp')
            ? 'webp'
            : 'jpg';
        const origName = `subject-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${origExt}`;
        await writeFile(resolve(uploadsDir, origName), file.buffer);
        originalImagePath = `uploads/${origName}`;

        if (dto.backgroundMode !== 'keep_original') {
          try {
            const processed =
              await this.imageProcessingService.processImageWithStatus(file, {
                preserveText: true,
              });
            subjectBase64 = processed.buffer.toString('base64');
            backgroundRemoved = processed.backgroundRemoved;
            this.logger.log(
              `Subject image attached (~${Math.round((subjectBase64.length * 0.75) / 1024)} KB, ` +
                `${backgroundRemoved ? 'Node.js background removed' : 'original bytes used'})`,
            );
          } catch (e) {
            this.logger.warn(`Subject background removal notice: ${e}`);
            subjectBase64 = file.buffer.toString('base64');
          }
        } else {
          subjectBase64 = file.buffer.toString('base64');
        }
      }

      // 3. Company Logo processing
      let logoPath: string | null = null;
      let logoBase64: string | undefined;
      let logoMimeType: string | undefined;

      if (logo && logo.buffer) {
        const uploadsDir = resolve(process.cwd(), 'public', 'uploads');
        await mkdir(uploadsDir, { recursive: true });
        const logoExt = logo.mimetype?.includes('png')
          ? 'png'
          : logo.mimetype?.includes('svg')
            ? 'svg'
            : 'jpg';
        const logoName = `logo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${logoExt}`;
        await writeFile(resolve(uploadsDir, logoName), logo.buffer);
        logoPath = `uploads/${logoName}`;
        logoBase64 = logo.buffer.toString('base64');
        logoMimeType = logo.mimetype || 'image/png';
        this.logger.log(
          `Company logo attached (~${Math.round((logoBase64.length * 0.75) / 1024)} KB)`,
        );
      }

      // 4. Category & niche normalization
      const category = dto.category
        ? dto.category.trim().toLowerCase()
        : dto.niche
          ? dto.niche.trim().toLowerCase()
          : undefined;

      // 5. Assemble complete DesignBriefContext (document fields + guided fields)
      const briefContext = {
        prompt: dto.prompt,
        category,
        content: dto.content,
        colorScheme: dto.colorScheme,
        font: dto.font,
        postSize: dto.postSize,
        outputType: dto.outputType || 'png',
        hasSubjectImage: Boolean(subjectBase64),
        backgroundRemoved,
        hasLogo: Boolean(logoBase64),

        // Guided fields preserved
        productName: dto.productName,
        platform: dto.platform,
        aspectRatio: dto.aspectRatio,
        style: dto.style,
        occasion: dto.occasion,
        backgroundMode: dto.backgroundMode,
        headline: dto.headline,
        bodyCopy: dto.bodyCopy,
        targetAudience: dto.targetAudience,
        keyMessage: dto.keyMessage,
        cta: dto.cta,
        language: dto.language,
        tone: brandTone,
        fontHeading,
        fontBody,
        primaryColor: dto.primaryColor,
        secondaryColor: dto.secondaryColor,
        accentColor: dto.accentColor,
        brandColors: brandColors.length ? brandColors : undefined,
        layoutPreference: dto.layoutPreference,
        niche: dto.niche,
        brandName: resolvedBrandName,
        additionalInstructions: dto.additionalInstructions,
      };

      // 6. Category-scoped RAG Style Retrieval
      let styles: RetrievedStyle[] = [];
      const queryText =
        dto.prompt ||
        dto.headline ||
        (dto.productName
          ? `${dto.productName} ${category || ''}`
          : 'social post');
      try {
        const queryEmbedding =
          await this.embeddingsService.embedText(queryText);
        styles = await this.retrieverService.retrieveStyleContext(
          userId,
          queryEmbedding,
          category,
        );
        this.logger.log(
          `RAG retrieved ${styles.length} style reference(s) (category: ${category || 'all'}): ` +
            styles
              .map((s) => `${s.source}(${(s.similarity * 100).toFixed(0)}%)`)
              .join(', '),
        );
      } catch (err: any) {
        this.logger.warn(
          `RAG retrieval skipped (${err?.message || err}). Proceeding without it.`,
        );
      }

      // 7. Two-Stage Prompting: Design-Planning Pass
      let plan: any = null;
      let finalPrompt = '';

      if (this.provider === 'gemini') {
        try {
          const plannerPrompt = this.promptBuilder.buildPlannerPrompt(
            briefContext,
            styles,
          );
          plan = await this.geminiService.planDesign(plannerPrompt);
          finalPrompt = this.promptBuilder.buildRendererPromptFromPlan(
            plan.image_generation_prompt,
            briefContext,
          );
          this.logger.log(
            'Two-stage design planning pass succeeded. Master prompt constructed.',
          );
        } catch (planErr: any) {
          this.logger.warn(
            `Design planning pass notice: ${planErr.message}. Falling back to direct synthesis.`,
          );
          finalPrompt = this.promptBuilder.buildFinalPrompt(
            briefContext,
            styles,
            'gemini',
          );
        }
      } else {
        finalPrompt = this.promptBuilder.buildFinalPrompt(
          briefContext,
          styles,
          'pollinations',
        );
      }

      // 8. Determine Canvas Dimensions & Aspect Ratio
      let effectiveRatio = dto.aspectRatio;
      if (!effectiveRatio && dto.postSize) {
        const size = dto.postSize.toLowerCase();
        if (size === 'instagram_portrait' || size === 'linkedin_post')
          effectiveRatio = '4:5';
        else if (
          size === 'instagram_story' ||
          size === 'whatsapp_status' ||
          size === 'tiktok_video'
        )
          effectiveRatio = '9:16';
        else if (
          size === 'twitter_post' ||
          size === 'youtube_thumbnail' ||
          size === 'meta_feed'
        )
          effectiveRatio = '16:9';
        else if (size === 'pinterest_pin') effectiveRatio = '3:4';
        else effectiveRatio = '1:1';
      } else if (!effectiveRatio && dto.platform) {
        const plat = dto.platform.toLowerCase();
        if (plat === 'tiktok' || plat === 'pinterest') effectiveRatio = '9:16';
        else if (plat === 'twitter' || plat === 'x') effectiveRatio = '16:9';
        else if (plat === 'linkedin') effectiveRatio = '4:5';
        else if (plat === 'facebook') effectiveRatio = '1.91:1';
        else effectiveRatio = '1:1';
      }

      let width = 1024;
      let height = 1024;
      if (effectiveRatio === '4:5') {
        width = 1024;
        height = 1280;
      } else if (effectiveRatio === '9:16') {
        width = 720;
        height = 1280;
      } else if (effectiveRatio === '16:9') {
        width = 1280;
        height = 720;
      } else if (effectiveRatio === '1.91:1') {
        width = 1200;
        height = 628;
      } else if (effectiveRatio === '2:3' || effectiveRatio === '3:4') {
        width = 1000;
        height = 1500;
      }

      // 9. Image Generation (Gemini image-first or Pollinations fallback)
      let generated: GeneratedImage;
      let usedProvider: 'gemini' | 'pollinations' = this.provider;

      if (this.provider === 'pollinations') {
        generated = await this.pollinationsService.generatePostImage({
          prompt: plan?.image_generation_prompt || finalPrompt,
          width,
          height,
        });
      } else {
        try {
          generated = await this.geminiService.generatePostImage({
            prompt: finalPrompt,
            imageBase64: subjectBase64,
            imageMimeType: file?.mimetype || 'image/png',
            logoBase64,
            logoMimeType,
            width,
            height,
            aspectRatio: effectiveRatio,
            postSize: dto.postSize,
          });
        } catch (error: any) {
          const message =
            error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `Gemini generation failed (${message.slice(0, 200)}...). Falling back to Pollinations.`,
          );
          usedProvider = 'pollinations';
          const fallbackPrompt =
            plan?.image_generation_prompt ||
            this.promptBuilder.buildFinalPrompt(
              briefContext,
              styles,
              'pollinations',
            );
          generated = await this.pollinationsService.generatePostImage({
            prompt: fallbackPrompt,
            width,
            height,
          });
        }
      }

      // 10. Persist Post Row
      const userPromptSummary =
        dto.prompt ||
        (dto.productName
          ? `${dto.productName} — ${dto.platform || 'Social'} (${dto.style || 'Luxury'})`
          : 'Social Media Post');

      const title = dto.headline
        ? dto.productName
          ? `${dto.productName}: ${dto.headline}`
          : dto.headline
        : dto.productName
          ? `${dto.productName} — ${dto.platform || 'Post'}`
          : dto.prompt
            ? dto.prompt.slice(0, 60)
            : 'Custom Post';

      const post = await this.postsService.createPost({
        userId,
        brandProfileId: dto.brandProfileId ?? null,
        title,
        productName: dto.productName ?? null,
        niche: dto.niche ?? null,
        category: category ?? null,
        content: dto.content ?? null,
        colorScheme: dto.colorScheme ?? null,
        font: dto.font ?? null,
        postSize: dto.postSize ?? null,
        outputType: dto.outputType || 'png',
        platform: dto.platform || 'instagram',
        aspectRatio: effectiveRatio || '1:1',
        style: dto.style || 'luxury',
        occasion: dto.occasion ?? null,
        backgroundMode: dto.backgroundMode || 'ai_replace',
        headline: dto.headline ?? null,
        bodyCopy: dto.bodyCopy ?? null,
        userPrompt: userPromptSummary,
        finalPrompt,
        originalImagePath,
        logoPath,
        designBrief: {
          plan: plan || null,
          context: briefContext,
        },
        engine: usedProvider,
        status: 'completed',
      });

      // 11. Save generated image file
      const normalizedOutputType = dto.outputType?.toLowerCase();
      const ext =
        normalizedOutputType === 'jpg' || normalizedOutputType === 'jpeg'
          ? 'jpg'
          : normalizedOutputType === 'png'
            ? 'png'
            : generated.mimeType === 'image/jpeg' ||
                generated.mimeType === 'image/jpg'
              ? 'jpg'
              : 'png';
      const fileName = `${post.id}.${ext}`;
      await mkdir(this.outputDir, { recursive: true });
      await writeFile(
        resolve(this.outputDir, fileName),
        Buffer.from(generated.imageBase64, 'base64'),
      );

      const imagePath = `generated-posts/${fileName}`;
      await this.postsService.postRepository.update(post.id, {
        imagePath,
        engine: usedProvider,
      });
      post.imagePath = imagePath;
      post.engine = usedProvider;

      this.logger.log(
        `Generated post ${post.id} via ${usedProvider} (${imagePath})`,
      );
      if (userId) {
        await this.notifService
          .create(
            userId,
            'Creative Ready! 🎨',
            `Your post for "${dto.productName || dto.prompt || 'Design'}" has been generated.`,
            'success',
          )
          .catch(() => {});
      }

      return this.formatResponse(post);
    } catch (err: any) {
      if (userId) {
        await this.billingService.refundCredits(
          userId,
          5,
          `Failed generation refund: ${promptTopic.slice(0, 30)}`,
        );
      }
      throw err;
    }
  }

  formatResponse(post: Post): PostResponseDto {
    return {
      id: post.id,
      imageUrl: post.imagePath ? `/${post.imagePath}` : null,
      originalImageUrl: post.originalImagePath
        ? `/${post.originalImagePath}`
        : null,
      logoUrl: post.logoPath ? `/${post.logoPath}` : null,
      userPrompt: post.userPrompt || '',
      finalPrompt: post.finalPrompt,
      title: post.title,
      productName: post.productName,
      niche: post.niche,
      category: post.category,
      content: post.content,
      colorScheme: post.colorScheme,
      font: post.font,
      postSize: post.postSize,
      outputType: post.outputType,
      format:
        post.imagePath?.toLowerCase().endsWith('.jpg') ||
        post.imagePath?.toLowerCase().endsWith('.jpeg')
          ? 'jpg'
          : 'png',
      designBrief: post.designBrief,
      platform: post.platform,
      aspectRatio: post.aspectRatio,
      style: post.style,
      occasion: post.occasion,
      backgroundMode: post.backgroundMode,
      headline: post.headline,
      bodyCopy: post.bodyCopy,
      rating: post.rating,
      isFavorite: post.isFavorite,
      engine: post.engine,
      status: post.status,
      createdAt: post.createdAt,
    };
  }
}
