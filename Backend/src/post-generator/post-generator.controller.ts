import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { MAX_PHOTO_BYTES } from '../common/upload/image-upload';
import type { UploadedFile as UploadType } from '../common/upload/image-upload';
import { PostsService } from '../posts/posts.service';
import { TokenService } from '../auth/jwt.service';
import { CreateGuidedPostDto } from './dto/create-guided-post.dto';
import { GeneratePostDto } from './dto/generate-post.dto';
import { ApprovePostDto } from './dto/approve-post.dto';
import { EditPostDto } from './dto/edit-post.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { RatePostDto } from './dto/rate-post.dto';
import { FeedbackService } from './feedback.service';
import { GeminiService } from './gemini.service';
import { PostGeneratorService } from './post-generator.service';
import { RateLimitService } from './rate-limit.service';

/**
 * AI Post Generator endpoints — guided creator, AI Vision analysis,
 * and post management with automatic JWT cookie/header session resolution.
 */
@ApiTags('post-generator')
@Controller('posts')
export class PostGeneratorController {
  constructor(
    private readonly postGeneratorService: PostGeneratorService,
    private readonly postsService: PostsService,
    private readonly feedbackService: FeedbackService,
    private readonly rateLimitService: RateLimitService,
    private readonly geminiService: GeminiService,
    private readonly tokenService: TokenService,
  ) {}

  /** Resolves authenticated user ID strictly from verified JWT cookie or Authorization header */
  private resolveUserId(req: Request): string | null {
    // 1. Authorization Bearer header
    const authHeader = req.headers['authorization'];
    if (authHeader && typeof authHeader === 'string') {
      const [bearer, token] = authHeader.split(' ');
      if (bearer === 'Bearer' && token) {
        try {
          const payload = this.tokenService.verify(token);
          if (payload?.sub) return payload.sub;
        } catch {}
      }
    }

    // 2. HTTP-only cookie access_token
    const cookies = (req as any).cookies;
    const cookieToken = cookies?.access_token || cookies?.social_yolo_jwt_token;
    if (cookieToken) {
      try {
        const payload = this.tokenService.verify(cookieToken);
        if (payload?.sub) return payload.sub;
      } catch {}
    }

    return null;
  }

  @Post('create-guided')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'file', maxCount: 6 },
        { name: 'files', maxCount: 6 },
        { name: 'logo', maxCount: 1 },
        { name: 'model', maxCount: 1 },
        // User reference screenshots / moodboards (style direction).
        { name: 'refImage', maxCount: 4 },
      ],
      { limits: { fileSize: MAX_PHOTO_BYTES } },
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Guided Post Creation',
    description:
      'Creates a professional social media campaign post based on guided choices ' +
      '(product name, platform, aspect ratio, style, background mode, occasion, headline) ' +
      'with intelligent automated art direction.',
  })
  @ApiResponse({
    status: 201,
    description: 'Post generated successfully.',
    type: PostResponseDto,
  })
  async createGuided(
    @UploadedFiles()
    files:
      | {
          file?: UploadType[];
          files?: UploadType[];
          logo?: UploadType[];
          model?: UploadType[];
          refImage?: UploadType[];
        }
      | undefined,
    @Body() dto: CreateGuidedPostDto,
    @Req() req: Request,
  ): Promise<PostResponseDto> {
    if (
      (!dto.productName || !dto.productName.trim()) &&
      (!dto.prompt || !dto.prompt.trim())
    ) {
      throw new BadRequestException(
        'Product/topic name or prompt is required.',
      );
    }
    const userId = this.resolveUserId(req);
    await this.rateLimitService.consume(userId ?? (req.ip || 'anonymous'));

    const modelFile = files?.model?.[0];

    // Consolidate and deduplicate product images from both 'files' and 'file' (excluding model file)
    const rawProductFiles: UploadType[] = [
      ...(files?.files || []),
      ...(files?.file || []),
    ].filter(
      (f) =>
        !modelFile ||
        !(
          f.originalname === modelFile.originalname && f.size === modelFile.size
        ),
    );
    const uniqueProductFiles = rawProductFiles.filter(
      (f, idx, arr) =>
        arr.findIndex(
          (o) => o.originalname === f.originalname && o.size === f.size,
        ) === idx,
    );

    return this.postGeneratorService.generateGuidedPost(
      dto,
      uniqueProductFiles.length > 0 ? uniqueProductFiles : undefined,
      userId,
      files?.logo?.[0],
      modelFile,
      files?.refImage && files.refImage.length > 0
        ? files.refImage
        : undefined,
    );
  }

  @Post('analyze-image')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_PHOTO_BYTES } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'AI Vision Product Photo Scanner',
    description:
      'Analyzes an uploaded product image using Advanced AI Vision to automatically detect ' +
      'the product name, niche/category, color palette, and suggest headlines and styles.',
  })
  async analyzeImage(@UploadedFile() file: UploadType | undefined) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Image file is required for analysis.');
    }
    const base64 = file.buffer.toString('base64');
    return this.geminiService.analyzeProductImage(
      base64,
      file.mimetype || 'image/png',
    );
  }

  /**
   * PROMPT LAB — returns the exact planner prompt, the final renderer prompt
   * and the RAG retrieval trace for a hypothetical brief, WITHOUT generating
   * an image or spending a credit.
   *
   * This is the endpoint to use while tuning
   * `src/post-generator/rag/prompt-builder.service.ts`: edit the prompt file,
   * hit this endpoint, and see precisely what Gemini would receive.
   */
  @Post('preview-prompt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Preview the exact prompts that would be sent to Gemini for a given brief (no image, no credits)',
  })
  async previewPrompt(@Body() dto: CreateGuidedPostDto, @Req() req: Request) {
    const userId = this.resolveUserId(req);
    return this.postGeneratorService.previewPrompts(dto, userId);
  }

  @Post('generate')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'file', maxCount: 1 },
        { name: 'logo', maxCount: 1 },
      ],
      { limits: { fileSize: MAX_PHOTO_BYTES } },
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Generate a designer-style social media post (Freeform prompt or complete brief)',
  })
  @ApiResponse({
    status: 201,
    description: 'Post generated successfully.',
    type: PostResponseDto,
  })
  async generate(
    @UploadedFiles()
    files: { file?: UploadType[]; logo?: UploadType[] } | undefined,
    @Body() dto: GeneratePostDto,
    @Req() req: Request,
  ): Promise<PostResponseDto> {
    if (
      (!dto.prompt || !dto.prompt.trim()) &&
      (!dto.productName || !dto.productName.trim())
    ) {
      throw new BadRequestException(
        'A post prompt or product name is required.',
      );
    }
    const userId = this.resolveUserId(req);
    await this.rateLimitService.consume(userId ?? (req.ip || 'anonymous'));
    return this.postGeneratorService.generatePost(
      dto,
      files?.file?.[0],
      userId,
      files?.logo?.[0],
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List posts with optional filters, search, and pagination',
  })
  async list(
    @Req() req: Request,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('platform') platform?: string,
    @Query('style') style?: string,
    @Query('search') search?: string,
    @Query('favoritesOnly') favoritesOnly?: string,
  ): Promise<{ items: PostResponseDto[]; total: number }> {
    const take = limit ? Number(limit) : 24;
    const skip = offset ? Number(offset) : 0;
    const isFav = favoritesOnly === 'true' || favoritesOnly === '1';
    const userId = this.resolveUserId(req);

    const { items, total } = await this.postsService.listPostsFiltered({
      userId: userId || undefined,
      platform,
      style,
      search,
      favoritesOnly: isFav,
      limit: take,
      offset: skip,
    });

    return {
      items: items.map((p) => this.postGeneratorService.formatResponse(p)),
      total,
    };
  }

  @Get('favorites')
  @ApiOperation({ summary: 'List all favorited posts' })
  async listFavorites(@Req() req: Request): Promise<PostResponseDto[]> {
    const userId = this.resolveUserId(req);
    const posts = await this.postsService.listFavorites(userId || undefined);
    return posts.map((p) => this.postGeneratorService.formatResponse(p));
  }

  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid', description: 'Generated post id' })
  @ApiOperation({ summary: 'Fetch one generated post by id' })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PostResponseDto> {
    const post = await this.postsService.findPostById(id);
    if (!post) {
      throw new NotFoundException(`Post ${id} not found.`);
    }
    return this.postGeneratorService.formatResponse(post);
  }

  @Post(':id/favorite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle favorite status for a post' })
  async toggleFavorite(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PostResponseDto> {
    const post = await this.postsService.toggleFavorite(id);
    return this.postGeneratorService.formatResponse(post);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a post' })
  async deletePost(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const userId = this.resolveUserId(req);
    return this.postsService.deletePost(id, userId);
  }

  @Post(':id/rate')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: RatePostDto })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Generated post id' })
  @ApiOperation({
    summary: 'Rate a generated post (1–5)',
  })
  async rate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RatePostDto,
    @Req() req: Request,
  ): Promise<PostResponseDto> {
    const userId = this.resolveUserId(req);
    return this.feedbackService.ratePost(id, dto.rating, userId);
  }

  /**
   * IMAGE EDITING.
   *
   * The user describes what they want changed; the request is combined with the
   * original creative and sent to Gemini together with the existing image, and
   * a revised image is returned. The original post is preserved and the edit is
   * stored as a new post linked to it via `parentPostId`.
   */
  @Post(':id/edit')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: EditPostDto })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Generated post id' })
  @ApiOperation({
    summary:
      'Edit a generated image using natural-language change instructions (image + instructions are sent to Gemini)',
  })
  @ApiResponse({ status: 200, type: PostResponseDto })
  async edit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EditPostDto,
    @Req() req: Request,
  ): Promise<PostResponseDto> {
    const userId = this.resolveUserId(req);
    await this.rateLimitService.consume(userId ?? (req.ip || 'anonymous'));
    return this.postGeneratorService.editPost(id, dto.instructions, userId);
  }

  /**
   * APPROVE → VECTOR KNOWLEDGE BASE.
   *
   * The explicit "I like this one" signal. Approving embeds the creative and
   * promotes it into the RAG knowledge base so it is retrieved as a style
   * reference for this user's future generations. Sending `approved: false`
   * withdraws it again.
   */
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: ApprovePostDto })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Generated post id' })
  @ApiOperation({
    summary:
      'Approve a generated post so it is stored in the vector knowledge base and used as a future style reference',
  })
  @ApiResponse({ status: 200, type: PostResponseDto })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApprovePostDto,
    @Req() req: Request,
  ): Promise<PostResponseDto> {
    const userId = this.resolveUserId(req);
    return this.postGeneratorService.approvePost(
      id,
      dto.approved !== false,
      userId,
    );
  }
}
