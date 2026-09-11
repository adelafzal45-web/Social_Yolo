import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PostsService } from '../posts/posts.service';
import { PostResponseDto } from './dto/post-response.dto';
import { EmbeddingsService } from './rag/embeddings.service';

/** Minimum rating for a post to enter the personal RAG style pool. */
const RATING_POOL_THRESHOLD = 4;

/**
 * Feedback loop (Module 4): user ratings decide which generated posts
 * become part of the user's retrievable style.
 *
 * - rating >= 4 → the post's final prompt is embedded (or re-embedded)
 *   and stored with source 'user' — future generations retrieve it.
 * - rating < 4  → any existing personal-pool embedding for the post is
 *   removed.
 */
@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private readonly postsService: PostsService,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  /**
   * Stores the rating and syncs the personal style pool accordingly.
   *
   * @param id Post id.
   * @param rating 1–5.
   * @param userId Optional identity (x-user-id header until real auth).
   *   If the post has no owner yet, the first rater claims it.
   */
  async ratePost(id: string, rating: number, userId: string | null): Promise<PostResponseDto> {
    const post = await this.postsService.findPostById(id);
    if (!post) {
      throw new NotFoundException(`Post ${id} not found.`);
    }

    const ownerId = post.userId ?? userId ?? null;
    await this.postsService.postRepository.update({ id }, { rating, userId: ownerId });

    const embedRepo = this.postsService.embeddingRepository;
    const existing = await embedRepo.findOne({ where: { postId: id, source: 'user' } });

    if (rating >= RATING_POOL_THRESHOLD) {
      // The style lives in the winning final prompt (+ the short brief).
      const contentText = post.finalPrompt
        ? `${post.userPrompt} — ${post.finalPrompt}`
        : post.userPrompt;
      const embedding = await this.embeddingsService.embedText(contentText);

      if (existing) {
        existing.contentText = contentText;
        existing.embedding = embedding;
        existing.styleMetadata = { ratedAt: new Date().toISOString(), rating };
        await embedRepo.save(existing);
      } else {
        await embedRepo.insert({
          postId: id,
          contentText,
          source: 'user',
          embedding,
          styleMetadata: { ratedAt: new Date().toISOString(), rating },
        });
      }
      this.logger.log(`Post ${id} rated ${rating}★ — added to the personal RAG style pool.`);
    } else if (existing) {
      await embedRepo.remove(existing);
      this.logger.log(`Post ${id} rated ${rating}★ — removed from the personal RAG style pool.`);
    }

    const updated = await this.postsService.findPostById(id);
    if (!updated) {
      throw new NotFoundException(`Post ${id} not found.`);
    }
    return {
      id: updated.id,
      imageUrl: updated.imagePath ? `/${updated.imagePath}` : null,
      userPrompt: updated.userPrompt,
      finalPrompt: updated.finalPrompt,
      rating: updated.rating,
      createdAt: updated.createdAt,
    };
  }
}