import { Injectable } from '@nestjs/common';

export interface PlatformConfig {
  name: string;
  key: string;
  maxCaptionLength: number;
  hashtagLimit: number;
  ctaStyle: string;
  recommendedAspectRatios: string[];
  visualPromptModifier: string;
  formattingRules: string[];
}

@Injectable()
export class PlatformStrategyService {
  private readonly platformConfigs: Record<string, PlatformConfig> = {
    instagram: {
      name: 'Instagram',
      key: 'instagram',
      maxCaptionLength: 1200,
      hashtagLimit: 7,
      ctaStyle: 'Tap link in bio / Save this post for later',
      recommendedAspectRatios: ['1:1', '4:5', '9:16'],
      visualPromptModifier: 'Editorial lifestyle aesthetic, polished color harmony, high resolution product showcase',
      formattingRules: [
        'Engaging first line hook before fold (125 characters)',
        'Use clean line breaks and bullet spacing',
        'Include 3-5 niche-relevant hashtags at the end',
      ],
    },
    facebook: {
      name: 'Facebook',
      key: 'facebook',
      maxCaptionLength: 2000,
      hashtagLimit: 3,
      ctaStyle: 'Click below to discover more / Comment your thoughts',
      recommendedAspectRatios: ['1:1', '16:9'],
      visualPromptModifier: 'Warm community and relatable storytelling aesthetic, clear focal point',
      formattingRules: [
        'Conversational opening addressing community or common challenge',
        'Direct value proposition in the body copy',
        'Clear outbound call to action',
      ],
    },
    linkedin: {
      name: 'LinkedIn',
      key: 'linkedin',
      maxCaptionLength: 2500,
      hashtagLimit: 3,
      ctaStyle: 'Read the full framework / Share your perspective in the comments',
      recommendedAspectRatios: ['1:1', '4:5', '16:9'],
      visualPromptModifier: 'Professional executive branding, clean minimal diagrams, elegant corporate studio lighting',
      formattingRules: [
        'Hook stating an industry problem or counter-intuitive insight',
        'Bulleted takeaways or actionable lessons',
        'Professional invitation for discussion without aggressive hard-selling',
      ],
    },
    x: {
      name: 'X (Twitter)',
      key: 'x',
      maxCaptionLength: 280,
      hashtagLimit: 2,
      ctaStyle: 'Bookmark this / Retweet if valuable',
      recommendedAspectRatios: ['16:9', '1:1'],
      visualPromptModifier: 'High-contrast graphic, bold typography, sharp visual punch',
      formattingRules: [
        'Ultra-concise punchy hook in under 200 characters',
        'Maximum 1-2 focused hashtags',
      ],
    },
    pinterest: {
      name: 'Pinterest',
      key: 'pinterest',
      maxCaptionLength: 500,
      hashtagLimit: 5,
      ctaStyle: 'Pin this idea / Save to your board',
      recommendedAspectRatios: ['2:3', '9:16'],
      visualPromptModifier: 'Vertical aesthetic moodboard, aspirational typography, warm cozy textures',
      formattingRules: [
        'Search-optimized title and description with key lifestyle keywords',
        'Actionable inspiration angle',
      ],
    },
    tiktok: {
      name: 'TikTok',
      key: 'tiktok',
      maxCaptionLength: 400,
      hashtagLimit: 5,
      ctaStyle: 'Follow for part 2 / Link in bio',
      recommendedAspectRatios: ['9:16'],
      visualPromptModifier: 'Dynamic vertical frame, authentic creator style, vibrant pop colors',
      formattingRules: [
        'Fast-paced casual caption with trending curiosity angle',
        'Direct creator call to action',
      ],
    },
  };

  getStrategy(platform: string): PlatformConfig {
    const key = (platform || 'instagram').toLowerCase().trim();
    return this.platformConfigs[key] || this.platformConfigs['instagram'];
  }

  getAllPlatforms(): PlatformConfig[] {
    return Object.values(this.platformConfigs);
  }
}
