import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiHeaders,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { MAX_PHOTO_BYTES } from '../common/upload/image-upload';
import type { UploadedFile as UploadType } from '../common/upload/image-upload';
import { PostsService } from '../posts/posts.service';
import { GeneratePostDto } from './dto/generate-post.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { RatePostDto } from './dto/rate-post.dto';
import { FeedbackService } from './feedback.service';
import { PostGeneratorService } from './post-generator.service';
import { RateLimitService } from './rate-limit.service';

/**
 * AI Post Generator endpoints — generates designer-style social media
 * posts from a short prompt and an optional subject image.
 */
@ApiTags('post-generator')
@Controller('posts')
export class PostGeneratorController {
  constructor(
    private readonly postGeneratorService: PostGeneratorService,
    private readonly postsService: PostsService,
    private readonly feedbackService: FeedbackService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  @Post('generate')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_PHOTO_BYTES } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'Optional subject image (jpg/png/webp, max 5 MB). Its background is removed ' +
            'via the image-processing pipeline before generation.',
        },
        prompt: {
          type: 'string',
          example: 'Eid sale post with 50% discount',
          description: 'Short description of the post; expanded into a full designer prompt automatically.',
        },
      },
      required: ['prompt'],
    },
  })
  @ApiOperation({
    summary: 'Generate a designer-style social media post',
    description:
      'Accepts a short prompt and an optional subject image. The image goes through the ' +
      'background-removal pipeline, the prompt is expanded automatically, and Google Gemini ' +
      'returns a finished post image that is stored and served from /generated-posts/.',
  })
  @ApiResponse({ status: 201, description: 'Post generated successfully.', type: PostResponseDto })
  @ApiResponse({ status: 400, description: 'Missing/invalid prompt, invalid image, or Gemini refused.' })
  @ApiResponse({ status: 503, description: 'GEMINI_API_KEY is not configured.' })
  @ApiResponse({ status: 502, description: 'Gemini API call failed.' })
  @ApiHeaders([
    {
      name: 'x-user-id',
      required: false,
      description:
        'Temporary user identity until real auth exists. Enables personal ' +
        'RAG style retrieval (your own high-rated posts).',
    },
  ])
  async generate(
    @UploadedFile() file: UploadType | undefined,
    @Body() dto: GeneratePostDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<PostResponseDto> {
    // Cost control — counts every attempt, even ones that fail at Gemini.
    this.rateLimitService.consume(userId ?? 'anonymous');
    return this.postGeneratorService.generatePost(dto.prompt.trim(), file, userId ?? null);
  }

  @Get()
  @ApiOperation({ summary: 'List the most recent generated posts' })
  @ApiResponse({ status: 200, description: 'Recent posts, newest first.', type: [PostResponseDto] })
  async list(@Query('limit') limit?: string): Promise<PostResponseDto[]> {
    const parsed = Number(limit);
    const take = Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), 100) : 20;
    const posts = await this.postsService.listPosts(take);
    return posts.map((post) => ({
      id: post.id,
      imageUrl: post.imagePath ? `/${post.imagePath}` : null,
      userPrompt: post.userPrompt,
      finalPrompt: post.finalPrompt,
      rating: post.rating,
      createdAt: post.createdAt,
    }));
  }

  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid', description: 'Generated post id' })
  @ApiOperation({ summary: 'Fetch one generated post by id' })
  @ApiResponse({ status: 200, description: 'The post record.', type: PostResponseDto })
  @ApiNotFoundResponse({ description: 'No post with this id.' })
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<PostResponseDto> {
    const post = await this.postsService.findPostById(id);
    if (!post) {
      throw new NotFoundException(`Post ${id} not found.`);
    }
    return {
      id: post.id,
      imageUrl: post.imagePath ? `/${post.imagePath}` : null,
      userPrompt: post.userPrompt,
      finalPrompt: post.finalPrompt,
      rating: post.rating,
      createdAt: post.createdAt,
    };
  }

  @Post(':id/rate')
  @HttpCode(HttpStatus.OK)
  @ApiHeaders([
    {
      name: 'x-user-id',
      required: false,
      description:
        'Temporary user identity until real auth exists. If the post has no ' +
        'owner yet, the first rater claims it.',
    },
  ])
  @ApiBody({ type: RatePostDto })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Generated post id' })
  @ApiOperation({
    summary: 'Rate a generated post (1–5)',
    description:
      'Feedback loop: ratings of 4 or 5 embed the post into your personal RAG ' +
      'style pool so future generations match your taste; lower ratings remove ' +
      'it from the pool.',
  })
  @ApiResponse({ status: 200, description: 'Rating stored; style pool updated.', type: PostResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid rating or post id.' })
  @ApiNotFoundResponse({ description: 'No post with this id.' })
  async rate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RatePostDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<PostResponseDto> {
    return this.feedbackService.ratePost(id, dto.rating, userId ?? null);
  }
}