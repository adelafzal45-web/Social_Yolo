import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
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
import { UsersService } from '../users/users.service';
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
    private readonly usersService: UsersService,
  ) {}

  /** Resolves authenticated user ID from JWT cookie, Authorization header, or x-user-id header */
  private async resolveUserId(
    req: Request,
    headerUserId?: string,
  ): Promise<string | null> {
    // 1. If request already has user attached (e.g. from JwtAuthGuard)
    if ((req as any).user?.id) {
      const uuid = await this.usersService.resolveToUuid((req as any).user.id);
      if (uuid) return uuid;
    }

    // 2. Explicit x-user-id header
    if (headerUserId && headerUserId.trim()) {
      const uuid = await this.usersService.resolveToUuid(headerUserId);
      if (uuid) return uuid;
    }

    // 3. Authorization Bearer header
    const authHeader = req.headers['authorization'];
    if (authHeader && typeof authHeader === 'string') {
      const [bearer, token] = authHeader.split(' ');
      if (bearer === 'Bearer' && token) {
        try {
          const payload = this.tokenService.verify(token);
          if (payload?.sub) {
            const uuid = await this.usersService.resolveToUuid(payload.sub);
            if (uuid) return uuid;
          }
        } catch {}
      }
    }

    // 4. HTTP-only JWT cookies
    const cookies = (req as any).cookies;
    const cookieToken = cookies?.access_token || cookies?.social_yolo_jwt_token;
    if (cookieToken) {
      try {
        const payload = this.tokenService.verify(cookieToken);
        if (payload?.sub) {
          const uuid = await this.usersService.resolveToUuid(payload.sub);
          if (uuid) return uuid;
        }
      } catch {}
    }

    // 5. Better Auth session cookie
    let rawCookieToken =
      cookies?.['better-auth.session_token'] ||
      cookies?.['__Secure-better-auth.session_token'];
    if (!rawCookieToken && req.headers['cookie']) {
      const match = String(req.headers['cookie']).match(
        /(?:(?:^|;\s*)(?:__Secure-)?better-auth\.session_token)=([^;]+)/,
      );
      if (match) rawCookieToken = decodeURIComponent(match[1]);
    }
    if (rawCookieToken) {
      let bToken = rawCookieToken.trim();
      if (bToken.startsWith('s:')) bToken = bToken.slice(2);
      if (bToken.includes('.')) bToken = bToken.split('.')[0];
      try {
        const sessionRows = await this.usersService['userRepository'].query(
          `SELECT u.id, u.email FROM "session" s JOIN "user" u ON s."userId" = u.id WHERE s.token = $1 AND s."expiresAt" > NOW() LIMIT 1`,
          [bToken],
        );
        if (sessionRows && sessionRows.length > 0) {
          const uuid = await this.usersService.resolveToUuid(sessionRows[0].id);
          if (uuid) return uuid;
        }
      } catch {}
    }

    return null;
  }

  @Post('create-guided')
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
    files: { file?: UploadType[]; logo?: UploadType[] } | undefined,
    @Body() dto: CreateGuidedPostDto,
    @Req() req: Request,
    @Headers('x-user-id') headerUserId?: string,
  ): Promise<PostResponseDto> {
    if (
      (!dto.productName || !dto.productName.trim()) &&
      (!dto.prompt || !dto.prompt.trim())
    ) {
      throw new BadRequestException(
        'Product/topic name or prompt is required.',
      );
    }
    const userId = await this.resolveUserId(req, headerUserId);
    this.rateLimitService.consume(userId ?? 'anonymous');
    return this.postGeneratorService.generateGuidedPost(
      dto,
      files?.file?.[0],
      userId,
      files?.logo?.[0],
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
    @Headers('x-user-id') headerUserId?: string,
  ): Promise<PostResponseDto> {
    if (
      (!dto.prompt || !dto.prompt.trim()) &&
      (!dto.productName || !dto.productName.trim())
    ) {
      throw new BadRequestException(
        'A post prompt or product name is required.',
      );
    }
    const userId = await this.resolveUserId(req, headerUserId);
    this.rateLimitService.consume(userId ?? 'anonymous');
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
    @Headers('x-user-id') headerUserId?: string,
  ): Promise<{ items: PostResponseDto[]; total: number }> {
    const take = limit ? Number(limit) : 24;
    const skip = offset ? Number(offset) : 0;
    const isFav = favoritesOnly === 'true' || favoritesOnly === '1';
    const userId = await this.resolveUserId(req, headerUserId);

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
  async listFavorites(
    @Req() req: Request,
    @Headers('x-user-id') headerUserId?: string,
  ): Promise<PostResponseDto[]> {
    const userId = await this.resolveUserId(req, headerUserId);
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
    @Headers('x-user-id') headerUserId?: string,
  ) {
    const userId = await this.resolveUserId(req, headerUserId);
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
    @Headers('x-user-id') headerUserId?: string,
  ): Promise<PostResponseDto> {
    const userId = await this.resolveUserId(req, headerUserId);
    return this.feedbackService.ratePost(id, dto.rating, userId);
  }
}
