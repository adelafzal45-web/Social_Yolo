import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PostEmbedding } from '../../posts/entities/post-embedding.entity';

/** One retrieved style reference handed to the prompt builder. */
export interface RetrievedStyle {
  postId: string;
  /** The short brief of the referenced post. */
  userPrompt: string;
  /** The full style description that was embedded. */
  contentText: string;
  /** 'user' = the user's own past post, 'sample' = global reference pool. */
  source: 'user' | 'sample';
  /** Cosine similarity to the current request, 0..1 (higher = closer). */
  similarity: number;
}

/** How many references to pull from each pool. */
const TOP_USER = 2;
const TOP_SAMPLE = 3;
/** Only the user's posts rated at least this high enter their style pool. */
const MIN_USER_RATING = 4;

/**
 * RAG retriever — finds the style references most similar to the current
 * request.
 *
 * Similarity is computed in the application (cosine over float arrays)
 * because pgvector is not installed on this Postgres instance. For the
 * expected corpus size (personal posts + a few dozen samples) this is
 * instant. Upgrade path: install pgvector, change the `embedding` column
 * to `vector(768)` and replace this method's body with one SQL query
 * using the `<=>` operator.
 */
@Injectable()
export class RetrieverService {
  constructor(
    @InjectRepository(PostEmbedding)
    private readonly embeddingRepo: Repository<PostEmbedding>,
  ) {}

  /**
   * Returns the most relevant style references: up to `TOP_USER` from the
   * given user's high-rated posts (when `userId` is provided) and up to
   * `TOP_SAMPLE` from the global sample pool, best matches first.
   */
  async retrieveStyleContext(
    userId: string | null,
    queryEmbedding: number[],
  ): Promise<RetrievedStyle[]> {
    const rows = await this.embeddingRepo.find({ relations: { post: true } });

    const scored = rows
      .filter((row) => row.embedding && row.embedding.length > 0)
      .map((row) => ({
        row,
        similarity: cosineSimilarity(queryEmbedding, row.embedding),
      }));

    const results: RetrievedStyle[] = [];

    if (userId) {
      scored
        .filter(
          ({ row }) =>
            row.source === 'user' &&
            row.post.userId === userId &&
            (row.post.rating ?? 0) >= MIN_USER_RATING,
        )
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, TOP_USER)
        .forEach(({ row, similarity }) => results.push(toStyle(row, similarity)));
    }

    scored
      .filter(({ row }) => row.source === 'sample')
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, TOP_SAMPLE)
      .forEach(({ row, similarity }) => results.push(toStyle(row, similarity)));

    return results;
  }
}

function toStyle(row: PostEmbedding, similarity: number): RetrievedStyle {
  return {
    postId: row.postId,
    userPrompt: row.post.userPrompt,
    contentText: row.contentText,
    source: row.source,
    similarity,
  };
}

/** Cosine similarity between two equal-length vectors; 0 for empty/mismatched input. */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) {
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