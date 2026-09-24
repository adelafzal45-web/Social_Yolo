export interface InspirationSearchRequest {
  query: string;
  industry?: string;
  product?: string;
  campaign?: string;
  contentType?: string;
  platform?: string;
  topic?: string;
  limit?: number;
  page?: number;
}

export interface InspirationItemDto {
  provider: string;
  externalId: string;
  externalUrl?: string;
  title?: string;
  description?: string;
  authorName?: string;
  authorUrl?: string;
  mediaType?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  width?: number;
  height?: number;
  tags?: string[];
  colors?: string[];
  metadata?: Record<string, any>;
  licenseInfo?: Record<string, any>;
}

export interface InspirationSearchResult {
  provider: string;
  query: string;
  total: number;
  items: InspirationItemDto[];
}

export interface InspirationProvider {
  readonly name: string;
  search(request: InspirationSearchRequest): Promise<InspirationSearchResult>;
  getItem(externalId: string): Promise<InspirationItemDto | null>;
}
