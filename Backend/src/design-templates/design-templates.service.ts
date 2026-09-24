import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DesignTemplate } from './entities/design-template.entity';

@Injectable()
export class DesignTemplatesService implements OnModuleInit {
  private readonly logger = new Logger(DesignTemplatesService.name);

  constructor(
    @InjectRepository(DesignTemplate)
    private readonly templateRepo: Repository<DesignTemplate>,
  ) {}

  async onModuleInit() {
    await this.seedTemplates();
  }

  async seedTemplates() {
    const count = await this.templateRepo.count();
    if (count > 0) return;

    this.logger.log('Seeding professional design templates (Section 19)...');

    const defaultTemplates: Partial<DesignTemplate>[] = [
      {
        name: 'Premium Product',
        category: 'Commercial Showcase',
        description: 'Large high-contrast hero subject with elegant editorial headline top-left and branded CTA bottom-right',
        grid: { type: 'golden_ratio' },
        margins: { top: 80, bottom: 80, left: 80, right: 80 },
        textRegions: {
          headline: { x: 80, y: 120, width: 600, height: 160, align: 'left', maxFontSize: 56 },
          subheadline: { x: 80, y: 300, width: 500, height: 80, align: 'left', maxFontSize: 24 },
        },
        imageRegions: {
          hero: { x: 100, y: 320, width: 880, height: 600, fit: 'contain' },
        },
        ctaRegion: { x: 740, y: 940, width: 260, height: 64, align: 'right', style: 'pill' },
        logoRegion: { x: 80, y: 80, maxWidth: 160, maxHeight: 60, position: 'top-left' },
        typographyRules: { hierarchy: 'high-contrast-display', headlineWeight: 'bold', letterSpacing: '-0.02em', lineHeightMultiplier: 1.15 },
        spacingRules: { whitespaceTier: 'generous', minPaddingPx: 32 },
        supportedRatios: ['1:1', '4:5', '9:16', '16:9'],
      },
      {
        name: 'Minimal Product',
        category: 'Minimalist Clean',
        description: 'Centered product focus with restrained typography, airy breathing room, and soft natural pedestal',
        grid: { type: 'centered' },
        margins: { top: 90, bottom: 90, left: 90, right: 90 },
        textRegions: {
          headline: { x: 140, y: 140, width: 800, height: 120, align: 'center', maxFontSize: 44 },
          subheadline: { x: 180, y: 270, width: 720, height: 60, align: 'center', maxFontSize: 20 },
        },
        imageRegions: {
          hero: { x: 190, y: 340, width: 700, height: 520, fit: 'contain' },
        },
        ctaRegion: { x: 410, y: 920, width: 260, height: 60, align: 'center', style: 'minimal_capsule' },
        logoRegion: { x: 440, y: 80, maxWidth: 200, maxHeight: 50, position: 'top-center' },
        typographyRules: { hierarchy: 'restrained-modern', headlineWeight: 'medium', letterSpacing: '0.04em', lineHeightMultiplier: 1.3 },
        spacingRules: { whitespaceTier: 'editorial', minPaddingPx: 48 },
        supportedRatios: ['1:1', '4:5', '3:4'],
      },
      {
        name: 'Bold Typography',
        category: 'Direct Response & Impact',
        description: 'Huge dynamic condensed typography dominating the top half with high-voltage accent CTA button',
        grid: { type: 'editorial_asymmetric' },
        margins: { top: 60, bottom: 60, left: 60, right: 60 },
        textRegions: {
          headline: { x: 60, y: 100, width: 960, height: 260, align: 'left', maxFontSize: 76 },
          subheadline: { x: 60, y: 380, width: 700, height: 90, align: 'left', maxFontSize: 26 },
        },
        imageRegions: {
          hero: { x: 300, y: 440, width: 720, height: 520, fit: 'cover' },
        },
        ctaRegion: { x: 60, y: 940, width: 320, height: 72, align: 'left', style: 'bold_rectangle' },
        logoRegion: { x: 860, y: 60, maxWidth: 160, maxHeight: 60, position: 'top-right' },
        typographyRules: { hierarchy: 'maximum-impact', headlineWeight: 'extrabold', letterSpacing: '-0.04em', lineHeightMultiplier: 1.0 },
        spacingRules: { whitespaceTier: 'low', minPaddingPx: 20 },
        supportedRatios: ['1:1', '16:9', '4:5', '9:16'],
      },
      {
        name: 'Editorial',
        category: 'High-Fashion & Lifestyle',
        description: 'Magazine-grade asymmetric composition with kicker text, delicate serif display font, and cinematic crop',
        grid: { type: 'editorial_asymmetric' },
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
        textRegions: {
          headline: { x: 100, y: 160, width: 540, height: 200, align: 'left', maxFontSize: 52 },
          subheadline: { x: 100, y: 380, width: 480, height: 110, align: 'left', maxFontSize: 22 },
        },
        imageRegions: {
          hero: { x: 520, y: 220, width: 460, height: 680, fit: 'cover' },
        },
        ctaRegion: { x: 100, y: 880, width: 220, height: 56, align: 'left', style: 'underlined_text' },
        logoRegion: { x: 100, y: 80, maxWidth: 180, maxHeight: 60, position: 'top-left' },
        typographyRules: { hierarchy: 'magazine-serif', headlineWeight: 'regular', letterSpacing: '-0.01em', lineHeightMultiplier: 1.2 },
        spacingRules: { whitespaceTier: 'editorial', minPaddingPx: 40 },
        supportedRatios: ['4:5', '1:1', '9:16'],
      },
      {
        name: 'Dark Premium',
        category: 'Luxury Dark Mode',
        description: 'Opulent midnight black and charcoal backdrop with glowing rim lighting and metallic gold accents',
        grid: { type: 'rule_of_thirds' },
        margins: { top: 80, bottom: 80, left: 80, right: 80 },
        textRegions: {
          headline: { x: 80, y: 140, width: 650, height: 160, align: 'left', maxFontSize: 54 },
          subheadline: { x: 80, y: 310, width: 550, height: 80, align: 'left', maxFontSize: 22 },
        },
        imageRegions: {
          hero: { x: 260, y: 360, width: 740, height: 560, fit: 'contain' },
        },
        ctaRegion: { x: 80, y: 920, width: 280, height: 64, align: 'left', style: 'gold_pill' },
        logoRegion: { x: 80, y: 70, maxWidth: 160, maxHeight: 50, position: 'top-left' },
        typographyRules: { hierarchy: 'luxury-contrast', headlineWeight: 'bold', letterSpacing: '0.02em', lineHeightMultiplier: 1.2 },
        spacingRules: { whitespaceTier: 'generous', minPaddingPx: 32 },
        supportedRatios: ['1:1', '4:5', '9:16', '16:9'],
      },
      {
        name: 'Split Screen',
        category: 'Modern Commercial',
        description: '50/50 division between crisp solid brand color messaging block and hero photography',
        grid: { type: 'split' },
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        textRegions: {
          headline: { x: 60, y: 220, width: 440, height: 220, align: 'left', maxFontSize: 48 },
          subheadline: { x: 60, y: 460, width: 400, height: 120, align: 'left', maxFontSize: 20 },
        },
        imageRegions: {
          hero: { x: 540, y: 0, width: 540, height: 1080, fit: 'cover' },
        },
        ctaRegion: { x: 60, y: 680, width: 260, height: 64, align: 'left', style: 'solid_button' },
        logoRegion: { x: 60, y: 80, maxWidth: 180, maxHeight: 60, position: 'top-left' },
        typographyRules: { hierarchy: 'structured-split', headlineWeight: 'extrabold', letterSpacing: '-0.02em', lineHeightMultiplier: 1.1 },
        spacingRules: { whitespaceTier: 'moderate', minPaddingPx: 24 },
        supportedRatios: ['1:1', '16:9'],
      },
    ];

    for (const t of defaultTemplates) {
      try {
        const entity = this.templateRepo.create(t as any);
        await this.templateRepo.save(entity);
      } catch (err: any) {
        this.logger.warn(`Template ${t.name} seeding warning: ${err.message}`);
      }
    }
  }

  async findByName(name: string): Promise<DesignTemplate | null> {
    return this.templateRepo.findOne({ where: { name } });
  }

  async selectTemplateForStrategy(style: string, compositionPreference?: string): Promise<DesignTemplate> {
    const templates = await this.templateRepo.find();
    if (templates.length === 0) {
      await this.seedTemplates();
    }

    if (compositionPreference === 'Split Layout') {
      const split = templates.find((t) => t.name === 'Split Screen');
      if (split) return split;
    }

    if (style === 'Minimal') {
      const min = templates.find((t) => t.name === 'Minimal Product');
      if (min) return min;
    }

    if (style === 'Bold') {
      const bold = templates.find((t) => t.name === 'Bold Typography');
      if (bold) return bold;
    }

    if (style === 'Editorial') {
      const edit = templates.find((t) => t.name === 'Editorial');
      if (edit) return edit;
    }

    if (style === 'Luxury' || style === 'Futuristic') {
      const dark = templates.find((t) => t.name === 'Dark Premium');
      if (dark) return dark;
    }

    return templates.find((t) => t.name === 'Premium Product') || templates[0];
  }

  async getAll(): Promise<DesignTemplate[]> {
    return this.templateRepo.find({ order: { name: 'ASC' } });
  }
}
