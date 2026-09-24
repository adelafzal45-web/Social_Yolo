/**
 * Common interfaces for website crawling, extraction snapshots, and provider contracts.
 */

export interface CrawledPageData {
  url: string;
  pageType: 'HOMEPAGE' | 'ABOUT' | 'PRODUCT' | 'SERVICE' | 'BLOG' | 'CONTACT' | 'OTHER';
  title: string;
  description: string;
  content: string;
  contentHash: string;
}

export interface WebsiteSnapshot {
  url: string;
  finalUrl?: string;

  title?: string;
  description?: string;

  headings: string[];

  text: string;

  language?: string;

  canonicalUrl?: string;

  viewport?: string;

  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    siteName?: string;
    type?: string;
  };

  twitter?: {
    title?: string;
    description?: string;
    image?: string;
    card?: string;
  };

  images: Array<{
    url: string;
    alt?: string;
    width?: number;
    height?: number;
  }>;

  logo?: string;

  favicon?: string;

  availableLogos?: string[];

  socialLinks: Array<{
    platform: string;
    url: string;
  }>;

  colors: string[];

  fonts: string[];

  structuredData: unknown[];

  crawledPages?: CrawledPageData[];

  extractedAt: string;

  isBrowserRendered?: boolean;
}

export interface CrawlerOptions {
  timeoutMs?: number;
  maxResponseBytes?: number;
  maxInternalPages?: number;
  onStep?: (stepId: string, label: string) => Promise<void> | void;
}

export interface WebsiteCrawler {
  readonly name: string;
  fetch(url: string, options?: CrawlerOptions): Promise<WebsiteSnapshot>;
}
