import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import sharp from 'sharp';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { CreativeExport } from '../creative-generation/entities/creative-export.entity';
import { CreativeVariation } from '../creative-generation/entities/creative-variation.entity';

export class ExportRequestDto {
  variationId!: string;
  format!: 'png' | 'jpg' | 'webp';
  platform?: string;
  customWidth?: number;
  customHeight?: number;
}

const PLATFORM_DIMENSIONS: Record<string, { width: number; height: number }> = {
  instagram_post: { width: 1080, height: 1350 },
  instagram_square: { width: 1080, height: 1080 },
  instagram_story: { width: 1080, height: 1920 },
  facebook_feed: { width: 1200, height: 628 },
  linkedin_post: { width: 1080, height: 1350 },
  twitter_feed: { width: 1200, height: 628 },
  pinterest_pin: { width: 1000, height: 1500 },
};

@Injectable()
export class CreativeExportService {
  private readonly logger = new Logger(CreativeExportService.name);
  private readonly exportDir: string;

  constructor(
    @InjectRepository(CreativeExport)
    private readonly exportRepo: Repository<CreativeExport>,
    @InjectRepository(CreativeVariation)
    private readonly variationRepo: Repository<CreativeVariation>,
  ) {
    this.exportDir = join(process.cwd(), 'public', 'exports');
    if (!existsSync(this.exportDir)) {
      mkdirSync(this.exportDir, { recursive: true });
    }
  }

  async exportCreative(dto: ExportRequestDto): Promise<CreativeExport> {
    const variation = await this.variationRepo.findOne({
      where: { id: dto.variationId },
      relations: ['generation'],
    });

    if (!variation) {
      throw new NotFoundException(`Variation ${dto.variationId} not found.`);
    }

    // Determine target dimensions
    let targetWidth = dto.customWidth || variation.width;
    let targetHeight = dto.customHeight || variation.height;

    if (dto.platform && PLATFORM_DIMENSIONS[dto.platform]) {
      targetWidth = PLATFORM_DIMENSIONS[dto.platform].width;
      targetHeight = PLATFORM_DIMENSIONS[dto.platform].height;
    }

    // Resolve source image path
    const renderPath = join(process.cwd(), 'public', variation.renderUrl.replace('/api/', ''));
    if (!existsSync(renderPath)) {
      throw new NotFoundException(`Render file at ${renderPath} not found.`);
    }

    const inputBuffer = readFileSync(renderPath);
    let sharpInstance = sharp(inputBuffer).resize(targetWidth, targetHeight, {
      fit: 'contain',
      background: '#000000',
    });

    let formatExt = dto.format || 'png';
    let outputBuffer: Buffer;

    if (formatExt === 'jpg') {
      outputBuffer = await sharpInstance.jpeg({ quality: 95 }).toBuffer();
    } else if (formatExt === 'webp') {
      outputBuffer = await sharpInstance.webp({ quality: 95 }).toBuffer();
    } else {
      outputBuffer = await sharpInstance.png({ quality: 95 }).toBuffer();
      formatExt = 'png';
    }

    const filename = `export_${Date.now()}_${targetWidth}x${targetHeight}.${formatExt}`;
    const outputPath = join(this.exportDir, filename);
    writeFileSync(outputPath, outputBuffer);

    const exportUrl = `/api/exports/${filename}`;

    const record = this.exportRepo.create({
      generationId: variation.generationId,
      variationId: variation.id,
      format: formatExt as any,
      platform: dto.platform || variation.generation?.platform || 'Instagram',
      width: targetWidth,
      height: targetHeight,
      exportUrl,
      fileSizeBytes: outputBuffer.length,
    });

    return this.exportRepo.save(record);
  }
}
