import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { MAX_PHOTO_BYTES } from '../common/upload/image-upload';
import type { UploadedFile as UploadType } from '../common/upload/image-upload';
import { TokenService } from '../auth/jwt.service';
import { UserRole } from '../users/entities/user.entity';
import {
  BulkCreateStyleReferenceDto,
  CreateStyleReferenceDto,
  ListStyleReferencesDto,
  UpdateStyleReferenceDto,
} from './dto/style-reference.dto';
import { StyleReferenceService } from './style-reference.service';
import { RetrieverService } from '../post-generator/rag/retriever.service';
import { EmbeddingsService } from '../post-generator/rag/embeddings.service';

function parseBool(value?: string): boolean {
  return value === 'true' || value === '1' || value === 'yes';
}

/**
 * Style Reference Library API.
 *
 * Upload reference images (or text playbooks) after logging in; each one is
 * auto-analysed by Gemini Vision, embedded, and immediately retrievable by
 * the RAG layer on the next generation. Admins get the extra global-scope,
 * seeding and reindex controls.
 */
@ApiTags('style-references')
@Controller('style-references')
export class StyleReferenceController {
  constructor(
    private readonly styleReferenceService: StyleReferenceService,
    private readonly retrieverService: RetrieverService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * Resolves the caller from the verified JWT (Bearer header or httpOnly
   * cookie) and returns their id + role. Throws when unauthenticated, because
   * every library endpoint sits behind a login.
   */
  private requireUser(req: Request): { id: string; role: string } {
    let payload: { sub?: string; role?: string } | null = null;

    const authHeader = req.headers['authorization'];
    if (authHeader && typeof authHeader === 'string') {
      const [bearer, token] = authHeader.split(' ');
      if (bearer === 'Bearer' && token) {
        try {
          payload = this.tokenService.verify(token);
        } catch {
          payload = null;
        }
      }
    }

    if (!payload) {
      const cookies = (req as any).cookies;
      const cookieToken =
        cookies?.access_token || cookies?.social_yolo_jwt_token;
      if (cookieToken) {
        try {
          payload = this.tokenService.verify(cookieToken);
        } catch {
          payload = null;
        }
      }
    }

    if (!payload?.sub) {
      throw new UnauthorizedException(
        'You must be signed in to manage style references.',
      );
    }
    return { id: payload.sub, role: payload.role || UserRole.USER };
  }

  @Get()
  @ApiOperation({
    summary:
      'List style references visible to the caller (own uploads + global pool)',
  })
  async list(@Req() req: Request, @Query() query: ListStyleReferencesDto) {
    const user = this.requireUser(req);
    const items = await this.styleReferenceService.list(
      user.id,
      query,
      user.role === UserRole.ADMIN,
    );
    return {
      items,
      total: items.length,
      categories: await this.styleReferenceService.listCategories(),
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'RAG corpus statistics for the current user' })
  async stats(@Req() req: Request) {
    const user = this.requireUser(req);
    return {
      ...(await this.retrieverService.getCorpusStats(user.id)),
      embeddingsConfigured: this.embeddingsService.isConfigured,
      embeddingModel:
        process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
      embeddingDimensions: Number(
        process.env.GEMINI_EMBEDDING_DIMENSIONS ?? 768,
      ),
    };
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_PHOTO_BYTES } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string' },
        notes: { type: 'string' },
        category: { type: 'string' },
        tags: { type: 'string' },
        hint: { type: 'string' },
        makeGlobal: { type: 'string', enum: ['true', 'false'] },
      },
      required: ['file'],
    },
  })
  @ApiOperation({
    summary:
      'Upload a reference image; it is AI-analysed and embedded automatically',
  })
  async upload(
    @Req() req: Request,
    @Body() dto: CreateStyleReferenceDto,
    @UploadedFile() file: UploadType,
  ) {
    const user = this.requireUser(req);
    if (!file) {
      throw new BadRequestException('An image file is required.');
    }
    const makeGlobal =
      parseBool(String((dto as any).makeGlobal ?? '')) &&
      user.role === UserRole.ADMIN;
    return this.styleReferenceService.createFromUpload(dto, file, user.id, {
      makeGlobal,
    });
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: BulkCreateStyleReferenceDto })
  @ApiOperation({
    summary: 'Create text-only knowledge entries (no image upload)',
  })
  async bulk(@Req() req: Request, @Body() dto: BulkCreateStyleReferenceDto) {
    const user = this.requireUser(req);
    const created: Awaited<
      ReturnType<StyleReferenceService['createTextEntry']>
    >[] = [];
    for (const item of dto.items || []) {
      if (!item?.title || !item?.notes) {
        continue;
      }
      created.push(
        await this.styleReferenceService.createTextEntry(user.id, {
          title: item.title,
          notes: item.notes,
          category: item.category,
          tags: item.tags,
          contentText: item.notes,
        }),
      );
    }
    return { items: created, total: created.length };
  }

  @Post('seed-starter-library')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Seed the built-in curated knowledge base (admin only, idempotent)',
  })
  async seed(@Req() req: Request) {
    const user = this.requireUser(req);
    this.assertAdmin(user.role);
    return this.styleReferenceService.seedStarterLibrary(user.id);
  }

  @Post('reindex')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Recompute embeddings for library entries that have none (admin only)',
  })
  async reindex(@Req() req: Request, @Query('force') force?: string) {
    const user = this.requireUser(req);
    this.assertAdmin(user.role);
    return this.styleReferenceService.reindex(parseBool(force || ''));
  }

  @Post(':id/scope')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({
    summary: 'Promote or demote an entry between global and private (admin only)',
  })
  async setScope(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { makeGlobal?: boolean },
  ) {
    const user = this.requireUser(req);
    this.assertAdmin(user.role);
    return this.styleReferenceService.setScope(
      id,
      Boolean(body?.makeGlobal),
      user.id,
    );
  }

  @Patch(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({
    summary: 'Update a style reference (re-embeds when text changes)',
  })
  async update(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStyleReferenceDto,
  ) {
    const user = this.requireUser(req);
    return this.styleReferenceService.update(
      id,
      dto,
      user.id,
      user.role === UserRole.ADMIN,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Delete a style reference and its stored image' })
  async remove(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string) {
    const user = this.requireUser(req);
    return this.styleReferenceService.remove(
      id,
      user.id,
      user.role === UserRole.ADMIN,
    );
  }

  private assertAdmin(role: string): void {
    if (role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only an administrator can perform this action on the global knowledge base.',
      );
    }
  }
}

