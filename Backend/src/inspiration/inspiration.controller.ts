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
import { InspirationService } from './inspiration.service';
import { TokenService } from '../auth/jwt.service';
import { UsersService } from '../users/users.service';

@ApiTags('inspiration')
@Controller(['inspiration', 'v1/inspiration'])
export class InspirationController {
  constructor(
    private readonly inspirationService: InspirationService,
    private readonly tokenService: TokenService,
    private readonly usersService: UsersService,
  ) {}

  private async resolveWorkspaceId(
    req: Request,
    headerUserId?: string,
  ): Promise<string> {
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

  @Get('search')
  @ApiOperation({ summary: 'Search creative inspiration across providers' })
  async search(
    @Query('q') query?: string,
    @Query('industry') industry?: string,
    @Query('product') product?: string,
    @Query('campaign') campaign?: string,
    @Query('contentType') contentType?: string,
    @Query('platform') platform?: string,
    @Query('provider') provider?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inspirationService.search(
      {
        query: query || '',
        industry,
        product,
        campaign,
        contentType,
        platform,
        limit: limit ? parseInt(limit, 10) : 15,
      },
      provider,
    );
  }

  @Get('collections')
  @ApiOperation({ summary: 'Get workspace inspiration collections' })
  async getCollections(
    @Req() req: Request,
    @Headers('x-user-id') headerUserId?: string,
  ) {
    const workspaceId = await this.resolveWorkspaceId(req, headerUserId);
    return this.inspirationService.getCollections(workspaceId);
  }

  @Post('collections')
  @ApiOperation({ summary: 'Create new inspiration collection' })
  async createCollection(
    @Body('name') name: string,
    @Body('description') description: string,
    @Body('itemIds') itemIds: string[],
    @Req() req: Request,
    @Headers('x-user-id') headerUserId?: string,
  ) {
    const workspaceId = await this.resolveWorkspaceId(req, headerUserId);
    return this.inspirationService.createCollection(
      workspaceId,
      name || 'My Moodboard',
      description,
      itemIds || [],
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inspiration item details and analysis' })
  async getItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.inspirationService.getItem(id);
  }

  @Post(':id/analyze')
  @ApiOperation({ summary: 'Analyze abstract style signals of inspiration item' })
  async analyzeItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.inspirationService.analyzeItem(id);
  }
}
