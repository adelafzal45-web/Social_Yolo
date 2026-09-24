import { Injectable, Logger } from '@nestjs/common';
import { RankedReference } from './reference-reranking.service';

export interface ExtractedDesignPattern {
  composition: {
    layout: string;
    focalPoint: string;
    textPlacement: string;
    ctaPlacement: string;
    whitespacePercentage: number;
    grid: string;
  };
  typography: {
    hierarchy: string;
    weight: string;
    bodyDensity: string;
    fontClassification: string;
    contrast: string;
  };
  color: {
    background: string;
    accentUsage: string;
    paletteSuggestions: string[];
  };
  spacing: {
    whitespace: string;
    marginTier: string;
  };
  visualTreatment: {
    depth: boolean;
    shadows: string;
    lighting: string;
    elements: string[];
  };
  visualHierarchy: {
    priorityOrder: string[];
  };
}

@Injectable()
export class DesignPatternExtractionService {
  private readonly logger = new Logger(DesignPatternExtractionService.name);

  /**
   * Converts top retrieved design references into structured design intelligence (Section 7).
   */
  extractPatterns(topReferences: RankedReference[]): ExtractedDesignPattern[] {
    return topReferences.map(({ scoredRef }) => {
      const ref = scoredRef.reference;
      const pat = ref.patterns?.[0];

      return {
        composition: {
          layout: pat?.composition?.layout || ref.composition?.layout || 'asymmetric editorial',
          focalPoint: pat?.composition?.focalPoint || ref.composition?.focalPoint || 'product',
          textPlacement: pat?.composition?.textPlacement || ref.composition?.textPlacement || 'upper-left',
          ctaPlacement: pat?.composition?.ctaPlacement || ref.composition?.ctaPlacement || 'lower-right',
          whitespacePercentage: pat?.composition?.whitespacePercentage || ref.composition?.whitespacePercentage || 35,
          grid: pat?.composition?.grid || ref.composition?.grid || 'rule_of_thirds',
        },
        typography: {
          hierarchy: pat?.typography?.hierarchy || ref.typography?.hierarchy || 'large headline with subtle kicker',
          weight: pat?.typography?.weight || ref.typography?.weight || 'bold',
          bodyDensity: pat?.typography?.bodyDensity || ref.typography?.bodyDensity || 'low',
          fontClassification: pat?.typography?.fontClassification || ref.typography?.fontClassification || 'modern-sans',
          contrast: pat?.typography?.contrast || ref.typography?.contrast || 'high',
        },
        color: {
          background: pat?.color?.background || 'dark with soft gradient',
          accentUsage: pat?.color?.accentUsage || 'controlled on CTA and highlights',
          paletteSuggestions: ref.colorPalette || ['#0f172a', '#ffffff'],
        },
        spacing: {
          whitespace: pat?.spacing?.whitespace || 'high',
          marginTier: 'generous',
        },
        visualTreatment: {
          depth: pat?.visualTreatment?.depth ?? true,
          shadows: pat?.visualTreatment?.shadows || 'subtle soft-drop',
          lighting: pat?.visualTreatment?.lighting || 'natural studio diffuse',
          elements: ref.visualElements || ['clean product backdrop'],
        },
        visualHierarchy: {
          priorityOrder: pat?.visualHierarchy?.priorityOrder || ['product', 'headline', 'cta'],
        },
      };
    });
  }
}
