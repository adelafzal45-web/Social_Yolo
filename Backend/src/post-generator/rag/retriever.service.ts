import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PostEmbedding } from '../../posts/entities/post-embedding.entity';
import { StyleReference } from '../../style-references/entities/style-reference.entity';

/** One retrieved design reference handed to the prompt builder. */
export interface RetrievedReference {
  id: string;
  /**
   * `user_post`   - a post this account generated and rated highly.
   * `global_post` - a curated sample post in the shared pool.
   * `style_ref`   - an image/text entry from the Style Reference Library.
   */
  kind: 'user_post' | 'global_post' | 'style_ref';
  /** Human label used to title the block inside the prompt. */
  title: string;
  /** The short brief that produced this reference. */
  brief: string;
  /** The full style description that was embedded. */
  contentText: string;
  category: string | null;
  /** 'user' = personal pool, 'sample'/'global' = shared pool. */
  source: 'user' | 'sample' | 'global' | 'library';
  /** Raw cosine similarity mapped to 0..1 (higher = closer). */
  similarity: number;
  /** Final hybrid rank score (cosine + category + quality + recency + lexical). */
  score: number;
  rating: number | null;
  /** True when an image is on disk and can be attached as a visual anchor. */
  hasImage: boolean;
  /** Path relative to `Backend/public` when `hasImage` is true. */
  imagePath: string | null;
}

/** Backwards-compatible alias - the prompt builder speaks in "styles". */
export type RetrievedStyle = RetrievedReference;

/** A retrieved reference that also carries an image worth attaching to Gemini. */
export interface RetrievedVisualReference {
  id: string;
  title: string;
  contentText: string;
  category: string | null;
  imagePath: string;
  similarity: number;
  score: number;
}

/** How many references to pull from the personal (rated posts) pool. */
const TOP_USER = 3;
/** How many references to pull from the shared global pool. */
const TOP_GLOBAL = 4;
/** Only posts rated at least this high enter the personal style pool. */
const MIN_USER_RATING = 4;

/**
 * Hybrid scoring weights. They deliberately do NOT sum to 1 - the result is
 * used for ranking only, never as a probability.
 */
const W_COSINE = 0.62;
const W_CATEGORY = 0.14;
const W_QUALITY = 0.12;
const W_RECENCY = 0.07;
const W_LEXICAL = 0.05;

/** Maximal-Marginal-Relevance trade-off: 1 = pure relevance, 0 = pure diversity. */
const MMR_LAMBDA = 0.75;

/** Flat snapshot of the embedding corpus, cached briefly between requests. */
interface CorpusRow {
  id: string;
  kind: RetrievedReference['kind'];
  title: string;
  brief: string;
  contentText: string;
  category: string | null;
  source: RetrievedReference['source'];
  embedding: number[] | null;
  rating: number | null;
  imagePath: string | null;
  createdAt: Date;
  /** Lowercase keyword soup used for the lexical overlap signal. */
  tokens: Set<string>;
}

/**
 * RAG retriever - finds the design references most similar to the current
 * request, from three pools:
 *
 *  1. **Personal** - posts this account rated 4/5 stars (taste the user proved).
 *  2. **Global**   - curated sample posts shared by the platform.
 *  3. **Library**  - style reference images/texts uploaded through the UI.
 *
 * Ranking is *hybrid* rather than pure cosine: semantic similarity is blended
 * with a category match, a quality signal (star rating), a mild recency boost
 * and a lexical keyword overlap. Finalists are then diversified with Maximal
 * Marginal Relevance so the prompt never receives three near-duplicates of the
 * same look.
 *
 * Similarity is computed in the application (cosine over float arrays) because
 * pgvector is not installed on this Postgres instance. The corpus is cached
 * in-process for a short TTL so a growing library does not turn every
 * generation into a full table scan. Upgrade path: install pgvector, change
 * the `embedding` column to `vector(768)` and replace the body of
 * `loadCorpus()` with a single `<=>` query.
 */
@Injectable()
export class RetrieverService {
  private readonly logger = new Logger(RetrieverService.name);

  /** Configurable via env so the ranker can be tuned without a code change. */
  private readonly minSimilarity = Number(process.env.RAG_MIN_SIMILARITY ?? 0.3);

  private corpusCache: { rows: CorpusRow[]; expiresAt: number } | null = null;
  private static readonly CORPUS_TTL_MS = 45_000;

  constructor(
    @InjectRepository(PostEmbedding)
    private readonly embeddingRepo: Repository<PostEmbedding>,
    @InjectRepository(StyleReference)
    private readonly styleRefRepo: Repository<StyleReference>,
  ) {}

  /**
   * Called by writers (feedback, library CRUD) so the next request sees fresh
   * data without waiting for the TTL to expire.
   */
  invalidateCache(): void {
    this.corpusCache = null;
  }

  /**
   * Returns the most relevant design references, best match first.
   *
   * @param userId         restricts the personal pool (null = anonymous)
   * @param queryEmbedding 768-dim vector of the current brief
   * @param category       optional category to boost/scope against
   * @param lexicalContext extra free text used for the keyword-overlap signal
   * @param limit          hard cap on the number of returned references
   */
  async retrieveStyleContext(
    userId: string | null,
    queryEmbedding: number[],
    category?: string | null,
    lexicalContext?: string,
    limit?: number,
  ): Promise<RetrievedReference[]> {
    if (!queryEmbedding || queryEmbedding.length === 0) {
      return [];
    }

    const targetCategory = normalizeCategory(category);
    const queryTokens = tokenize(
      [targetCategory, lexicalContext].filter(Boolean).join(' '),
    );

    const corpus = await this.loadCorpus(userId);
    const usable = corpus.filter(
      (row) => row.embedding && row.embedding.length > 0,
    );
    if (usable.length === 0) {
      return [];
    }

    const scored = usable
      .map((row) => this.score(row, queryEmbedding, targetCategory, queryTokens))
      .filter((entry) => entry.similarity > 0);

    if (scored.length === 0) {
      return [];
    }

    const personal = scored.filter((e) => e.row.kind === 'user_post');
    const shared = scored.filter((e) => e.row.kind !== 'user_post');

    const cap = limit ?? TOP_USER + TOP_GLOBAL;
    const pickFrom = (pool: typeof scored, n: number) => {
      const strong = pool.filter((e) => e.similarity >= this.minSimilarity);
      if (strong.length > 0) {
        return diversify(strong, n);
      }
      // Nothing clears the confidence bar. Rather than injecting an
      // irrelevant reference, fall back to the single best available one.
      const best = [...pool].sort((a, b) => b.score - a.score).slice(0, 1);
      return diversify(best, 1);
    };

    const picked = [
      ...pickFrom(personal, Math.min(TOP_USER, Math.max(1, Math.ceil(cap / 2)))),
      ...pickFrom(shared, Math.min(TOP_GLOBAL, Math.max(1, Math.floor(cap / 2)))),
    ];

    // Final ordering: personal proof first, then best-scoring shared knowledge.
    return picked
      .sort((a, b) => {
        if (a.row.kind !== b.row.kind) {
          return a.row.kind === 'user_post' ? -1 : 1;
        }
        return b.score - a.score;
      })
      .slice(0, cap)
      .map(({ row, similarity, score }) => toReference(row, similarity, score));
  }

  /**
   * Returns the highest-scoring references that actually have an image on
   * disk, so the caller can attach them to the image model as visual anchors.
   * Uses the same hybrid ranking as `retrieveStyleContext`.
   */
  async retrieveVisualReferences(
    userId: string | null,
    queryEmbedding: number[],
    category?: string | null,
    lexicalContext?: string,
    limit = 2,
  ): Promise<RetrievedVisualReference[]> {
    if (limit <= 0 || !queryEmbedding || queryEmbedding.length === 0) {
      return [];
    }

    const targetCategory = normalizeCategory(category);
    const queryTokens = tokenize(
      [targetCategory, lexicalContext].filter(Boolean).join(' '),
    );
    const corpus = await this.loadCorpus(userId);
    const candidates = corpus
      .filter((row) => row.imagePath && row.embedding && row.embedding.length > 0)
      .map((row) => this.score(row, queryEmbedding, targetCategory, queryTokens))
      .filter((entry) => entry.similarity >= this.minSimilarity)
      .sort((a, b) => b.score - a.score);

    // Personal references win ties against the shared library.
    const diversified = diversify(candidates, limit).sort((a, b) => {
      if (a.row.kind !== b.row.kind) {
        return a.row.kind === 'user_post' ? -1 : 1;
      }
      return b.score - a.score;
    });

    return diversified.map(({ row, similarity, score }) => ({
      id: row.id,
      title: row.title,
      contentText: row.contentText,
      category: row.category,
      imagePath: row.imagePath as string,
      similarity,
      score,
    }));
  }

  /** Diagnostics for the Prompt Lab / admin knowledge screen. */
  async getCorpusStats(userId?: string | null): Promise<{
    total: number;
    userPosts: number;
    globalPosts: number;
    styleReferences: number;
    withImages: number;
  }> {
    const corpus = await this.loadCorpus(userId ?? null);
    return {
      total: corpus.length,
      userPosts: corpus.filter((r) => r.kind === 'user_post').length,
      globalPosts: corpus.filter((r) => r.kind === 'global_post').length,
      styleReferences: corpus.filter((r) => r.kind === 'style_ref').length,
      withImages: corpus.filter((r) => Boolean(r.imagePath)).length,
    };
  }

  /* ------------------------------------------------------------------ */
  /* internals                                                           */
  /* ------------------------------------------------------------------ */

  /**
   * Loads (and briefly caches) every retrievable row, narrowed in SQL to the
   * caller's personal pool plus the shared pools.
   */
  private async loadCorpus(userId: string | null): Promise<CorpusRow[]> {
    if (this.corpusCache && this.corpusCache.expiresAt > Date.now()) {
      return this.corpusCache.rows;
    }

    try {
      const [postRows, libraryRows] = await Promise.all([
        this.embeddingRepo.find({
          relations: { post: true },
          select: {
            id: true,
            postId: true,
            contentText: true,
            source: true,
            category: true,
            embedding: true,
            post: {
              id: true,
              userId: true,
              userPrompt: true,
              title: true,
              productName: true,
              category: true,
              niche: true,
              style: true,
              occasion: true,
              rating: true,
              imagePath: true,
              isApproved: true,
              createdAt: true,
            },
          },
        }),
        this.styleRefRepo.find({
          where: { isActive: true },
          select: {
            id: true,
            ownerUserId: true,
            title: true,
            contentText: true,
            category: true,
            tags: true,
            imagePath: true,
            source: true,
            embedding: true,
            createdAt: true,
          },
        }),
      ]);

      const rows: CorpusRow[] = [];


      for (const row of postRows) {
        const isPersonal = row.source === 'user';
        if (isPersonal && row.post?.userId !== userId) {
          continue; // never leak one account's taste into another's
        }
        if (!isPersonal && userId && row.post?.userId) {
          continue; // another account's post is not part of the shared pool
        }
        // The personal taste pool only accepts posts the user actually approved.
        // Two signals count as approval: an explicit "Approve" action, or a
        // 4★+ rating (the pre-existing feedback loop).
        const approved = Boolean(row.post?.isApproved);
        if (
          isPersonal &&
          !approved &&
          (row.post?.rating ?? 0) < MIN_USER_RATING
        ) {
          continue;
        }

        const brief = row.post?.userPrompt || row.post?.title || 'Past post';
        const category =
          normalizeCategory(row.category) ||
          normalizeCategory(row.post?.category) ||
          normalizeCategory(row.post?.niche) ||
          null;

        rows.push({
          id: row.id,
          kind: isPersonal ? 'user_post' : 'global_post',
          title:
            row.post?.title ||
            row.post?.productName ||
            (isPersonal ? 'Your approved past post' : 'Curated reference post'),
          brief,
          contentText: row.contentText,
          category,
          source: isPersonal ? 'user' : 'sample',
          embedding: row.embedding && row.embedding.length ? row.embedding : null,
          // An explicit approval counts as a strong quality signal even when
          // the user never picked a star rating, so it ranks well in the pool.
          rating: row.post?.rating ?? (approved ? 5 : null),
          imagePath: row.post?.imagePath ?? null,
          createdAt: row.post?.createdAt ?? new Date(0),
          tokens: tokenize(
            [brief, row.contentText, category, row.post?.style, row.post?.occasion]
              .filter(Boolean)
              .join(' '),
          ),
        });
      }

      for (const row of libraryRows) {
        if (row.source !== 'global' && row.ownerUserId !== userId) {
          continue; // private library entries stay private
        }
        const category = normalizeCategory(row.category) || null;
        rows.push({
          id: row.id,
          kind: 'style_ref',
          title: row.title || 'Style reference',
          brief: row.title || 'Style reference',
          contentText: row.contentText,
          category,
          source: row.source === 'global' ? 'global' : 'library',
          embedding: row.embedding && row.embedding.length ? row.embedding : null,
          // Library entries are curated, so they get a neutral-high quality mark.
          rating: 4,
          imagePath: row.imagePath,
          createdAt: row.createdAt,
          tokens: tokenize(
            [row.title, row.contentText, category, (row.tags || []).join(' ')]
              .filter(Boolean)
              .join(' '),
          ),
        });
      }

      this.corpusCache = {
        rows,
        expiresAt: Date.now() + RetrieverService.CORPUS_TTL_MS,
      };
      return rows;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`RAG corpus load failed (${message}). Retrieval disabled.`);
      this.corpusCache = { rows: [], expiresAt: Date.now() + 5_000 };
      return [];
    }
  }

  /** Blends every ranking signal into one comparable number. */
  private score(
    row: CorpusRow,
    queryEmbedding: number[],
    targetCategory: string | null,
    queryTokens: Set<string>,
  ): { row: CorpusRow; similarity: number; score: number } {
    const raw = cosineSimilarity(queryEmbedding, row.embedding as number[]);
    // Map cosine from [-1, 1] into [0, 1] so the weights stay interpretable.
    const similarity = Math.max(0, Math.min(1, (raw + 1) / 2));

    const categoryScore =
      targetCategory && row.category
        ? categoryAffinity(targetCategory, row.category)
        : 0;

    const qualityScore = row.rating
      ? Math.max(0, Math.min(1, row.rating / 5))
      : 0.4;

    const ageDays = (Date.now() - new Date(row.createdAt).getTime()) / 86_400_000;
    const recencyScore = Number.isFinite(ageDays)
      ? Math.max(0, 1 - ageDays / 365)
      : 0.5;

    const lexicalScore = jaccard(queryTokens, row.tokens);

    const score =
      W_COSINE * similarity +
      W_CATEGORY * categoryScore +
      W_QUALITY * qualityScore +
      W_RECENCY * recencyScore +
      W_LEXICAL * lexicalScore +
      // Personal proof of taste is worth a small unconditional bonus.
      (row.kind === 'user_post' ? 0.04 : 0);

    return { row, similarity, score };
  }
}


/* -------------------------------------------------------------------- */
/* pure helpers                                                           */
/* -------------------------------------------------------------------- */

interface ScoredRow {
  row: CorpusRow;
  similarity: number;
  score: number;
}

/**
 * Maximal Marginal Relevance: greedily pick items that are relevant *and*
 * different from what has already been selected. `lambda` close to 1 keeps
 * pure relevance, lower values push harder toward variety.
 */
function diversify<T extends ScoredRow>(items: T[], count: number): T[] {
  if (count <= 0 || items.length === 0) {
    return [];
  }
  const pool = [...items].sort((a, b) => b.score - a.score);
  const selected: T[] = [];
  const vectors: number[][] = [];

  while (selected.length < count && pool.length > 0) {
    let bestIndex = 0;
    let bestValue = -Infinity;

    for (let i = 0; i < pool.length; i += 1) {
      const candidate = pool[i];
      const redundancy = vectors.length
        ? Math.max(
            ...vectors.map((v) =>
              cosineSimilarity(v, candidate.row.embedding as number[]),
            ),
          )
        : 0;
      const value = MMR_LAMBDA * candidate.score - (1 - MMR_LAMBDA) * redundancy;
      if (value > bestValue) {
        bestValue = value;
        bestIndex = i;
      }
    }

    const [chosen] = pool.splice(bestIndex, 1);
    if (chosen) {
      selected.push(chosen);
      if (chosen.row.embedding) {
        vectors.push(chosen.row.embedding);
      }
    }
  }

  return selected;
}

function toReference(
  row: CorpusRow,
  similarity: number,
  score: number,
): RetrievedReference {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    brief: row.brief,
    contentText: row.contentText,
    category: row.category,
    source: row.source,
    similarity,
    score,
    rating: row.rating,
    hasImage: Boolean(row.imagePath),
    imagePath: row.imagePath,
  };
}

/** Cosine similarity between two equal-length vectors; 0 for empty/mismatched input. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || a.length !== b.length) {
    return 0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'your', 'our',
  'post', 'image', 'style', 'design', 'using', 'make', 'create', 'a', 'an',
  'of', 'to', 'in', 'on', 'is', 'it', 'be', 'as', 'at', 'by', 'or',
]);

/** Lowercase word tokenizer with a small stop-word list. */
function tokenize(text: string): Set<string> {
  return new Set(
    (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/[\s-]+/)
      .filter((t) => t.length > 2 && !STOP_WORDS.has(t)),
  );
}

/** Jaccard overlap of two token sets, 0..1. */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) {
    return 0;
  }
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) {
      intersection += 1;
    }
  }
  return intersection / (a.size + b.size - intersection);
}

/** Normalises a free-text category into a comparable lowercase slug. */
export function normalizeCategory(value?: string | null): string {
  const clean = (value || '').trim().toLowerCase();
  return clean.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);
}

/**
 * 1 when the categories agree, partial credit when one contains the other
 * (e.g. "beauty" vs "beauty-skincare"), 0 otherwise.
 */
function categoryAffinity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.6;
  const aTokens = new Set(a.split('-'));
  const bTokens = new Set(b.split('-'));
  let shared = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) {
      shared += 1;
    }
  }
  return shared > 0 ? 0.3 : 0;
}

