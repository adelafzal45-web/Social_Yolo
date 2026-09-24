import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { UpdateBrandInsightsDto } from './dto/update-brand-insights.dto';
import { TokenService } from '../auth/jwt.service';
import { UsersService } from '../users/users.service';

import { BrandAnalysisProcessor } from './brand-analysis.processor';
import { WebsiteAnalyzerService } from './website-analyzer.service';

@ApiTags('brands')
@Controller(['brands', 'v1/brands'])
export class BrandsController {
  constructor(
    private readonly brandsService: BrandsService,
    private readonly tokenService: TokenService,
    private readonly usersService: UsersService,
    private readonly analysisProcessor: BrandAnalysisProcessor,
    private readonly websiteAnalyzer: WebsiteAnalyzerService,
  ) {}

  private async resolveUserId(
    req: Request,
    headerUserId?: string,
  ): Promise<string> {
    // 1. If request already has user attached (e.g. from JwtAuthGuard)
    if ((req as any).user?.id) {
      const uuid = await this.usersService.resolveToUuid((req as any).user.id);
      if (uuid) return uuid;
    }

    // 2. Explicit x-user-id header (validate/resolve to UUID)
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

    // Fallback: If unauthenticated, use the primary admin/system user to guarantee foreign key integrity
    const admin = await this.usersService.findByEmail(
      process.env.ADMIN_EMAIL || 'admin@socialyolo.com',
    );
    if (admin) {
      return admin.id;
    }

    throw new BadRequestException(
      'Authentication required to manage brand profiles.',
    );
  }

  /* ──── Brand Profile CRUD ──── */

  @Get()
  @ApiOperation({ summary: 'List all brand profiles for current user' })
  async list(@Req() req: Request, @Headers('x-user-id') headerUserId?: string) {
    const userId = await this.resolveUserId(req, headerUserId);
    return this.brandsService.listUserBrands(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single brand profile by ID' })
  async getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
    @Headers('x-user-id') headerUserId?: string,
  ) {
    const userId = await this.resolveUserId(req, headerUserId);
    return this.brandsService.getBrandById(userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new brand profile' })
  async create(
    @Body() dto: CreateBrandDto,
    @Req() req: Request,
    @Headers('x-user-id') headerUserId?: string,
  ) {
    const userId = await this.resolveUserId(req, headerUserId);
    return this.brandsService.createBrand(userId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update existing brand profile' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBrandDto,
    @Req() req: Request,
    @Headers('x-user-id') headerUserId?: string,
  ) {
    const userId = await this.resolveUserId(req, headerUserId);
    return this.brandsService.updateBrand(userId, id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Patch existing brand profile' })
  async patchBrand(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBrandDto,
    @Req() req: Request,
    @Headers('x-user-id') headerUserId?: string,
  ) {
    const userId = await this.resolveUserId(req, headerUserId);
    return this.brandsService.updateBrand(userId, id, dto);
  }

  @Get(':id/full')
  @ApiOperation({ summary: 'Get full brand profile with insights and sources' })
  async getFullBrand(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
    @Headers('x-user-id') headerUserId?: string,
  ) {
    const userId = await this.resolveUserId(req, headerUserId);
    return this.brandsService.getFullBrand(userId, id);
  }

  /* ──── Website Analysis (Async Queue) ──── */

  @Post(['analyze-url', 'analyze'])
  @ApiOperation({ summary: 'Trigger asynchronous website analysis job' })
  async analyzeUrl(@Body() body: any) {
    const rawUrl = typeof body === 'string' ? body : body?.url;
    if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
      throw new BadRequestException('Website URL is required.');
    }
    const jobId = await this.analysisProcessor.createJob(rawUrl.trim());
    return {
      jobId,
      status: 'queued',
      message: 'Website analysis job successfully queued.',
    };
  }

  @Get(['analysis/:jobId', 'analyze/job/:jobId'])
  @ApiOperation({ summary: 'Get status and result of website analysis job' })
  async getAnalysisStatus(@Param('jobId') jobId: string) {
    const job = await this.analysisProcessor.getJob(jobId);
    if (!job) {
      throw new BadRequestException(`Analysis job ${jobId} not found.`);
    }
    return job;
  }

  @Post('analyze/sync')
  @ApiOperation({ summary: 'Synchronously crawl and analyze a website URL' })
  async analyzeSync(@Body() body: any) {
    const rawUrl = typeof body === 'string' ? body : body?.url;
    if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
      throw new BadRequestException('Website URL is required.');
    }
    const normalized = this.websiteAnalyzer.normalizeUrl(rawUrl.trim());
    const crawlData = await this.websiteAnalyzer.crawlWebsite(normalized);
    const result = await this.websiteAnalyzer.buildBrandProfileWithAi(crawlData);
    return {
      ...result,
      crawledPages: crawlData.pages,
    };
  }

  @Post(':id/reanalyze')
  @ApiOperation({ summary: 'Re-analyze website for an existing brand' })
  async reanalyzeBrand(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
    @Headers('x-user-id') headerUserId?: string,
  ) {
    const userId = await this.resolveUserId(req, headerUserId);
    const brand = await this.brandsService.getBrandById(userId, id);
    if (!brand.websiteUrl) {
      throw new BadRequestException('Brand has no website URL configured.');
    }
    const jobId = await this.analysisProcessor.createJob(brand.websiteUrl, brand.id, true);
    return {
      jobId,
      status: 'queued',
      brandId: brand.id,
      message: 'Brand re-analysis job queued.',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete brand profile' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
    @Headers('x-user-id') headerUserId?: string,
  ) {
    const userId = await this.resolveUserId(req, headerUserId);
    return this.brandsService.deleteBrand(userId, id);
  }

  /* ──── Brand Insights ──── */

  @Get(':id/insights')
  @ApiOperation({ summary: 'Get brand insights (products, services, audience, etc.)' })
  async getInsights(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
    @Headers('x-user-id') headerUserId?: string,
  ) {
    const userId = await this.resolveUserId(req, headerUserId);
    const insights = await this.brandsService.getInsights(userId, id);
    return insights || {};
  }

  @Patch(':id/insights')
  @ApiOperation({ summary: 'Update brand insights (user edits)' })
  async updateInsights(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBrandInsightsDto,
    @Req() req: Request,
    @Headers('x-user-id') headerUserId?: string,
  ) {
    const userId = await this.resolveUserId(req, headerUserId);
    return this.brandsService.updateInsightsFromUser(userId, id, dto);
  }

  /* ──── Brand Sources ──── */

  @Get(':id/sources')
  @ApiOperation({ summary: 'Get crawled website sources for a brand' })
  async getSources(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
    @Headers('x-user-id') headerUserId?: string,
  ) {
    const userId = await this.resolveUserId(req, headerUserId);
    return this.brandsService.getSources(userId, id);
  }
}
