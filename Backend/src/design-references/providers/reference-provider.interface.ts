export interface ReferenceFilterOptions {
  platform?: string;
  designType?: string;
  industry?: string;
  style?: string;
  aspectRatio?: string;
  objective?: string;
  minQualityScore?: number;
  limit?: number;
}

export interface DesignReferenceItem {
  id: string;
  source: string;
  sourceUrl?: string | null;
  externalId?: string | null;
  title: string;
  description?: string | null;
  imageUrl: string;
  thumbnailUrl?: string | null;
  category?: string | null;
  industry?: string | null;
  platform?: string | null;
  designType?: string | null;
  style?: string | null;
  aspectRatio?: string;
  width?: number;
  height?: number;
  composition: {
    layout: string;
    focalPoint: string;
    textPlacement: string;
    ctaPlacement: string;
    grid?: string;
    whitespacePercentage?: number;
  };
  typography: {
    hierarchy: string;
    weight: string;
    bodyDensity: string;
    fontClassification?: string;
    contrast?: string;
  };
  colorPalette: string[];
  visualElements: string[];
  qualityScore: number;
  licenseType: string;
}

export interface DesignReferenceProvider {
  readonly name: string;
  searchReferences(query: string, filters?: ReferenceFilterOptions): Promise<DesignReferenceItem[]>;
  getReference(id: string): Promise<DesignReferenceItem | null>;
}
