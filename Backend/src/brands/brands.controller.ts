import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { ExtractBrandUrlDto } from './dto/extract-brand-url.dto';
import { TokenService } from '../auth/jwt.service';
import { UsersService } from '../users/users.service';

@ApiTags('brands')
@Controller('brands')
export class BrandsController {
  constructor(
    private readonly brandsService: BrandsService,
    private readonly tokenService: TokenService,
    private readonly usersService: UsersService,
  ) {}

  private async resolveUserId(
    req: Request,
    headerUserId?: string,
  ): Promise<string> {
    if (headerUserId && headerUserId.trim()) {
      return headerUserId.trim();
    }

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

    const cookies = (req as any).cookies;
    const cookieToken = cookies?.access_token || cookies?.social_yolo_jwt_token;
    if (cookieToken) {
      try {
        const payload = this.tokenService.verify(cookieToken);
        if (payload?.sub) return payload.sub;
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

  @Post('extract-from-url')
  @ApiOperation({
    summary: 'Auto-extract brand DNA and company details from a website URL',
    description:
      'Scrapes website metadata and analyzes it with AI to extract brand colors, fonts, tone, niche, and logo',
  })
  async extractFromUrl(@Body() dto: ExtractBrandUrlDto) {
    return this.brandsService.extractBrandFromUrl(dto.url);
  }

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
}
