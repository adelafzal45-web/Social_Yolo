import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Headers,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContentConceptsService } from './content-concepts.service';
import { TokenService } from '../auth/jwt.service';
import { UsersService } from '../users/users.service';

@ApiTags('content-concepts')
@Controller(['content-concepts', 'v1/content-concepts'])
export class ContentConceptsController {
  constructor(
    private readonly conceptsService: ContentConceptsService,
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
  @ApiOperation({ summary: 'Autonomously generate content concepts for a brand' })
  async generate(
    @Body('brandId') brandId: string,
    @Body('campaignId') campaignId: string,
    @Body('pillarId') pillarId: string,
    @Req() req: Request,
    @Headers('x-user-id') headerUserId?: string,
  ) {
    const userId = await this.resolveUserId(req, headerUserId);
    return this.conceptsService.generateConcepts(userId, brandId, {
      campaignId,
      pillarId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List concepts for a brand' })
  async list(@Query('brandId') brandId: string) {
    return this.conceptsService.listConcepts(brandId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single concept by ID' })
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.conceptsService.getConceptById(id);
  }

  @Post(':id/use')
  @ApiOperation({ summary: 'Mark concept as used and proceed to content generation' })
  async useConcept(@Param('id', ParseUUIDPipe) id: string) {
    return this.conceptsService.useConcept(id);
  }
}
