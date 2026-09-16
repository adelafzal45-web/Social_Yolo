/**
 * Catalog of the structured design requirements users can attach to a
 * post-generation request (the "design brief"). The front end sends these
 * as plain multipart form fields; `PromptBuilderService` weaves every
 * provided field into the final designer prompt and the whole brief is
 * persisted with the post for future dynamic handling.
 */

/** All supported post sizes/formats with their exact canvas geometry. */
export const POST_SIZES = {
  instagram_post: {
    label: 'Instagram post',
    aspect: 'square 1:1',
    width: 1080,
    height: 1080,
  },
  instagram_portrait: {
    label: 'Instagram portrait post',
    aspect: 'vertical 4:5',
    width: 1080,
    height: 1350,
  },
  instagram_story: {
    label: 'Instagram story',
    aspect: 'vertical 9:16',
    width: 1080,
    height: 1920,
  },
  meta_feed: {
    label: 'Meta / Facebook feed post',
    aspect: 'landscape 1.91:1',
    width: 1200,
    height: 630,
  },
  meta_square: {
    label: 'Meta / Facebook square post',
    aspect: 'square 1:1',
    width: 1080,
    height: 1080,
  },
  linkedin_post: {
    label: 'LinkedIn post',
    aspect: 'landscape 1.91:1',
    width: 1200,
    height: 627,
  },
  twitter_post: {
    label: 'X (Twitter) post',
    aspect: 'landscape 16:9',
    width: 1200,
    height: 675,
  },
  pinterest_pin: {
    label: 'Pinterest pin',
    aspect: 'vertical 2:3',
    width: 1000,
    height: 1500,
  },
  youtube_thumbnail: {
    label: 'YouTube thumbnail',
    aspect: 'landscape 16:9',
    width: 1280,
    height: 720,
  },
  whatsapp_status: {
    label: 'WhatsApp status',
    aspect: 'vertical 9:16',
    width: 1080,
    height: 1920,
  },
} as const;

export type PostSizeKey = keyof typeof POST_SIZES;

/** Stable list of the size keys (used by validation + Swagger enum). */
export const POST_SIZE_KEYS = Object.keys(POST_SIZES) as PostSizeKey[];

/** Supported output file types. */
export const POST_OUTPUT_TYPES = ['jpg', 'png'] as const;
export type PostOutputType = (typeof POST_OUTPUT_TYPES)[number];

/** Suggestions for the free-text category field (users may type anything). */
export const POST_CATEGORIES = [
  'gym',
  'education',
  'drinks',
  'food',
  'restaurant',
  'fashion',
  'beauty',
  'electronics',
  'real estate',
  'travel',
  'healthcare',
  'sports',
  'ecommerce',
  'entertainment',
] as const;

/**
 * The structured design brief — every field is optional except the size
 * fallbacks applied by the service (`postSize` → instagram_post,
 * `outputType` → png). `category` is normalized (trimmed lowercase) on
 * write so RAG retrieval can filter strictly by category.
 */
export interface DesignBrief {
  /** Exact copy to write on the post (verbatim, no paraphrasing). */
  content: string | null;
  /** Brand color scheme (free text, e.g. "navy blue and orange" or hex codes). */
  colorScheme: string | null;
  /** Font to use for all text on the post. */
  font: string | null;
  /** Design category (gym, food, education…) — also scopes RAG retrieval. */
  category: string | null;
  /** Requested post size/format key. */
  postSize: PostSizeKey;
  /** Requested output file type. */
  outputType: PostOutputType;
}

/** Human-readable one-liner describing a post size (used in prompts/logs). */
export function describePostSize(key: PostSizeKey): string {
  const size = POST_SIZES[key];
  return `${size.label} — ${size.aspect}, ${size.width}x${size.height} px`;
}

/** Normalizes a category for storage/comparison: trimmed lowercase, null when empty. */
export function normalizeCategory(category?: string | null): string | null {
  const cleaned = category?.trim().toLowerCase();
  return cleaned ? cleaned : null;
}
