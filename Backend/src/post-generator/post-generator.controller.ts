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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
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
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'Optional subject/product image (jpg/png/webp, max 5 MB). Its background is ' +
            'removed via the image-processing pipeline; it becomes the FIRST attached image.',
        },
        logo: {
          type: 'string',
          format: 'binary',
          description:
            'Optional company logo (jpg/png/webp, max 5 MB). Attached SECOND, placed on ' +
            'the design unchanged in a prominent spot.',
        },
        prompt: {
          type: 'string',
          example: 'Eid sale post with 50% discount',
          description:
            'Short description of the post; expanded into a full designer prompt automatically.',
        },
        content: {
          type: 'string',
          example: 'MEGA SALE — 50% OFF | Shop now',
          description: 'Exact copy/text to write on the post (optional).',
        },
        colorScheme: {
          type: 'string',
          example: 'navy blue background with orange accents',
          description:
            'Brand color scheme (names, hex codes or description) (optional).',
        },
        font: {
          type: 'string',
          example: 'Montserrat',
          description: 'Font to use for all text on the post (optional).',
        },
        category: {
          type: 'string',
          example: 'gym',
          description:
            'Design category (gym, education, drinks, food… — free text). Scopes RAG ' +
            'retrieval to past posts of the same category (optional).',
        },
        postSize: {
          type: 'string',
          example: 'instagram_post',
          enum: [
            'instagram_post',
            'instagram_portrait',
            'instagram_story',
            'meta_feed',
            'meta_square',
            'linkedin_post',
            'twitter_post',
            'pinterest_pin',
            'youtube_thumbnail',
            'whatsapp_status',
          ],
          description:
            'Post size/format — sets the exact canvas (e.g. instagram_story = 9:16, ' +
            '1080x1920). Defaults to instagram_post.',
        },
        outputType: {
          type: 'string',
          enum: ['jpg', 'png'],
          example: 'png',
          description: 'Output file type. Defaults to png.',
        },
      },
      required: ['prompt'],
    },
  })
  @ApiOperation({
    summary: 'Generate a designer-style social media post',
    description:
      'Accepts a short prompt, an optional structured design brief (content copy, color ' +
      'scheme, font, category, post size, output type), an optional subject image and an ' +
      'optional company logo. The subject goes through the background-removal pipeline, ' +
      'the RAG layer retrieves category-matched style references, and the whole brief is ' +
      'expanded into a designer prompt that Google Gemini renders into a finished post.',
  })
  @ApiResponse({
    status: 201,
    description: 'Post generated successfully.',
    type: PostResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Missing/invalid prompt, invalid image or logo, or Gemini refused.',
  })
  @ApiResponse({
    status: 503,
    description: 'GEMINI_API_KEY is not configured.',
  })
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
    @UploadedFiles()
    files: { file?: UploadType[]; logo?: UploadType[] } | undefined,
    @Body() dto: GeneratePostDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<PostResponseDto> {
    // Cost control — counts every attempt, even ones that fail at Gemini.
    this.rateLimitService.consume(userId ?? 'anonymous');
    return this.postGeneratorService.generatePost({
      userPrompt: dto.prompt.trim(),
      userId: userId ?? null,
      file: files?.file?.[0],
      logo: files?.logo?.[0],
      content: dto.content ?? null,
      colorScheme: dto.colorScheme ?? null,
      font: dto.font ?? null,
      category: dto.category ?? null,
      postSize: dto.postSize ?? null,
      outputType: dto.outputType ?? null,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List the most recent generated posts' })
  @ApiResponse({
    status: 200,
    description: 'Recent posts, newest first.',
    type: [PostResponseDto],
  })
  async list(@Query('limit') limit?: string): Promise<PostResponseDto[]> {
    const parsed = Number(limit);
    const take =
      Number.isFinite(parsed) && parsed > 0
        ? Math.min(Math.floor(parsed), 100)
        : 20;
    const posts = await this.postsService.listPosts(take);
    return posts.map((post) => ({
      id: post.id,
      imageUrl: post.imagePath ? `/${post.imagePath}` : null,
      userPrompt: post.userPrompt,
      finalPrompt: post.finalPrompt,
      category: post.category,
      postSize: post.postSize,
      outputType: post.outputType,
      designBrief: post.designBrief,
      rating: post.rating,
      createdAt: post.createdAt,
    }));
  }

  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid', description: 'Generated post id' })
  @ApiOperation({ summary: 'Fetch one generated post by id' })
  @ApiResponse({
    status: 200,
    description: 'The post record.',
    type: PostResponseDto,
  })
  @ApiNotFoundResponse({ description: 'No post with this id.' })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PostResponseDto> {
    const post = await this.postsService.findPostById(id);
    if (!post) {
      throw new NotFoundException(`Post ${id} not found.`);
    }
    return {
      id: post.id,
      imageUrl: post.imagePath ? `/${post.imagePath}` : null,
      userPrompt: post.userPrompt,
      finalPrompt: post.finalPrompt,
      category: post.category,
      postSize: post.postSize,
      outputType: post.outputType,
      designBrief: post.designBrief,
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
  @ApiResponse({
    status: 200,
    description: 'Rating stored; style pool updated.',
    type: PostResponseDto,
  })
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
