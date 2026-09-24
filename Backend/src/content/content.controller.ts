import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Headers,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { TokenService } from '../auth/jwt.service';
import { UsersService } from '../users/users.service';
import { GenerateContentDto } from './dto/generate-content.dto';

@ApiTags('content')
@Controller(['content', 'v1/content'])
export class ContentController {
  constructor(
    private readonly contentService: ContentService,
    private readonly tokenService: TokenService,
    private readonly usersService: UsersService,
  ) {}

  private async resolveUserId(req: Request, headerUserId?: string): Promise<string> {
    if ((req as any).user?.id) {
      const uuid = await this.usersService.resolveToUuid((req as any).user.id);
      if (uuid) return uuid;
    }
    if (headerUserId && headerUserId.trim()) {
      const uuid = await this.usersService.resolveToUuid(headerUserId);
      if (uuid) return uuid;
    }
    const admin = await this.usersService.findByEmail(
      process.env.ADMIN_EMAIL || 'admin@socialyolo.com',
    );
    return admin?.id || 'd0cf85ae-ed2c-486a-889d-27dca93daa66';
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate content variations from structured brand DNA (no prompts)' })
  async generate(
    @Body() dto: GenerateContentDto,
    @Req() req: Request,
    @Headers('x-user-id') headerUserId?: string,
  ) {
    const userId = await this.resolveUserId(req, headerUserId);
    return this.contentService.generateContent(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List generated posts/content with optional filters' })
  async list(
    @Query('brandId') brandId?: string,
    @Query('platform') platform?: string,
    @Query('status') status?: string,
  ) {
    return this.contentService.listContent(brandId, platform, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single post content by ID' })
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.contentService.getContentById(id);
  }

  @Post(':id/regenerate')
  @ApiOperation({ summary: 'Regenerate post variation using current brand context' })
  async regenerate(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
    @Headers('x-user-id') headerUserId?: string,
  ) {
    const userId = await this.resolveUserId(req, headerUserId);
    return this.contentService.regenerateContent(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit headline, caption, CTA, or hashtags of a post' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updates: any,
  ) {
    return this.contentService.updateContent(id, updates);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve post draft for publishing' })
  async approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.contentService.approveContent(id);
  }
}
