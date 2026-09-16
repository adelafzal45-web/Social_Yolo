import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

import { PostsService } from '../posts/posts.service';
import { PostResponseDto } from './dto/post-response.dto';
import { EmbeddingsService } from './rag/embeddings.service';
import {
  ImageEmbeddingsService,
  mimeFromImagePath,
} from './rag/image-embeddings.service';

/** Minimum rating for a post to enter the personal RAG style pool. */
const RATING_POOL_THRESHOLD = 4;

/**
 * Feedback loop (Module 4): user ratings decide which generated posts
 * become part of the user's retrievable style.
 *
 * - rating >= 4 → the post's final prompt is embedded (or re-embedded)
 *   and stored with source 'user' — future generations retrieve it.
 *   The post's IMAGE is CLIP-embedded into the personal image-style pool
 *   the same way.
 * - rating < 4  → any existing personal-pool embeddings (text AND image)
 *   for the post are removed.
 */
@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private readonly postsService: PostsService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly imageEmbeddingsService: ImageEmbeddingsService,
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

    const embedRepo = this.postsService.embeddingRepository;
    const existing = await embedRepo.findOne({
      where: { postId: id, source: 'user' },
    });

    if (rating >= RATING_POOL_THRESHOLD) {
      // The style lives in the winning final prompt (+ the short brief).
      const contentText = post.finalPrompt
        ? `${post.userPrompt} — ${post.finalPrompt}`
        : post.userPrompt;
      const embedding = await this.embeddingsService.embedText(contentText);
      const metadata = {
        ratedAt: new Date().toISOString(),
        rating,
        category: post.category ?? undefined,
      };

      if (existing) {
        existing.contentText = contentText;
        existing.embedding = embedding;
        existing.category = post.category ?? null;
        existing.styleMetadata = metadata;
        await embedRepo.save(existing);
      } else {
        await embedRepo.insert({
          postId: id,
          contentText,
          source: 'user',
          category: post.category ?? null,
          embedding,
          styleMetadata: metadata,
        });
      }
      this.logger.log(
        `Post ${id} rated ${rating}★ — added to the personal RAG style pool` +
          (post.category ? ` (category "${post.category}").` : '.'),
      );

      // Image side: CLIP-embed the post's actual picture into the personal
      // image-style pool. A CLIP/Python failure must not fail the rating —
      // the text pool above is already updated.
      if (post.imagePath) {
        try {
          const imageRepo = this.postsService.imageEmbeddingRepository;
          const buffer = await readFile(
            resolve(process.cwd(), 'public', post.imagePath),
          );
          const clip = await this.imageEmbeddingsService.embedImage(
            buffer,
            post.imagePath,
            mimeFromImagePath(post.imagePath),
          );
          const metadata = {
            ratedAt: new Date().toISOString(),
            rating,
            category: post.category ?? undefined,
          };
          const existingImage = await imageRepo.findOne({
            where: { postId: id, source: 'user' },
          });
          if (existingImage) {
            existingImage.imagePath = post.imagePath;
            existingImage.model = clip.model;
            existingImage.dims = clip.dimensions;
            existingImage.embedding = clip.vector;
            existingImage.category = post.category ?? null;
            existingImage.styleMetadata = metadata;
            await imageRepo.save(existingImage);
          } else {
            await imageRepo.insert({
              postId: id,
              imagePath: post.imagePath,
              source: 'user',
              model: clip.model,
              dims: clip.dimensions,
              embedding: clip.vector,
              category: post.category ?? null,
              styleMetadata: metadata,
            });
          }
          this.logger.log(
            `Post ${id} image added to the personal image-style pool.`,
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `Post ${id} image could not be added to the image-style pool (${message}).`,
          );
        }
      }
    } else {
      if (existing) {
        await embedRepo.remove(existing);
        this.logger.log(
          `Post ${id} rated ${rating}★ — removed from the personal RAG style pool.`,
        );
      }
      const existingImage =
        await this.postsService.imageEmbeddingRepository.findOne({
          where: { postId: id, source: 'user' },
        });
      if (existingImage) {
        await this.postsService.imageEmbeddingRepository.remove(existingImage);
        this.logger.log(
          `Post ${id} rated ${rating}★ — removed from the personal image-style pool.`,
        );
      }
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
      category: updated.category,
      postSize: updated.postSize,
      outputType: updated.outputType,
      designBrief: updated.designBrief,
      rating: updated.rating,
      createdAt: updated.createdAt,
    };
  }
}
