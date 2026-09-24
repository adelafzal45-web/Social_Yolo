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
  async ratePost(
    id: string,
    rating: number,
    userId: string | null,
  ): Promise<PostResponseDto> {
    const post = await this.postsService.findPostById(id);
    if (!post) {
      throw new NotFoundException(`Post ${id} not found.`);
    }

    const ownerId = post.userId ?? userId ?? null;
    await this.postsService.postRepository.update(
      { id },
      { rating, userId: ownerId },
    );
    await this.postsService.postRepository.manager.connection.queryResultCache?.remove(
      [`posts:id:${id}`],
    );
    // also directly update cached entry in postsService
    await (this.postsService as any).cache?.del(`posts:id:${id}`);
    await (this.postsService as any).cache?.delPattern('posts:*');

    const embedRepo = this.postsService.embeddingRepository;
    const existing = await embedRepo.findOne({
      where: { postId: id, source: 'user' },
    });

    if (rating >= RATING_POOL_THRESHOLD) {
      // The style lives in the winning final prompt (+ the short brief).
      const contentText =
        (post.finalPrompt
          ? `${post.userPrompt} — ${post.finalPrompt}`
          : post.userPrompt) || '';
      try {
        const embedding = await this.embeddingsService.embedText(contentText);
        const postCategory =
          post.category || (post.niche ? post.niche.toLowerCase() : null);

        if (existing) {
          existing.contentText = contentText;
          existing.embedding = embedding;
          existing.category = postCategory;
          existing.styleMetadata = {
            ratedAt: new Date().toISOString(),
            rating,
          };
          await embedRepo.save(existing);
        } else {
          await embedRepo.insert({
            postId: id,
            contentText,
            source: 'user',
            category: postCategory,
            embedding,
            styleMetadata: { ratedAt: new Date().toISOString(), rating },
          });
        }
        this.logger.log(
          `Post ${id} rated ${rating}★ (category: ${postCategory || 'none'}) — added to the personal RAG style pool.`,
        );
      } catch (err: any) {
        this.logger.warn(
          `Failed to embed post for RAG style pool: ${err?.message || err}`,
        );
      }
    } else if (existing) {
      await embedRepo.remove(existing);
      this.logger.log(
        `Post ${id} rated ${rating}★ — removed from the personal RAG style pool.`,
      );
    }

    const updated = await this.postsService.findPostById(id);
    if (!updated) {
      throw new NotFoundException(`Post ${id} not found.`);
    }
    return {
      id: updated.id,
      imageUrl: updated.imagePath ? `/${updated.imagePath}` : null,
      originalImageUrl: updated.originalImagePath
        ? `/${updated.originalImagePath}`
        : null,
      logoUrl: updated.logoPath ? `/${updated.logoPath}` : null,
      userPrompt: updated.userPrompt || '',
      finalPrompt: updated.finalPrompt,
      title: updated.title,
      productName: updated.productName,
      niche: updated.niche,
      category: updated.category,
      content: updated.content,
      colorScheme: updated.colorScheme,
      font: updated.font,
      postSize: updated.postSize,
      outputType: updated.outputType,
      designBrief: updated.designBrief,
      platform: updated.platform,
      aspectRatio: updated.aspectRatio,
      style: updated.style,
      occasion: updated.occasion,
      backgroundMode: updated.backgroundMode,
      headline: updated.headline,
      bodyCopy: updated.bodyCopy,
      rating: updated.rating,
      isFavorite: updated.isFavorite,
      engine: updated.engine,
      status: updated.status,
      createdAt: updated.createdAt,
    };
  }
}
