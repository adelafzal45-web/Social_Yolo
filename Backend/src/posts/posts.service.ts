import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Post } from './entities/post.entity';
import { PostEmbedding } from './entities/post-embedding.entity';

/** Data needed to persist one generated post. */
export interface CreatePostInput {
  /** NULL for global sample posts. */
  userId?: string | null;
  userPrompt: string;
  finalPrompt?: string | null;
  imagePath?: string | null;
}

/**
 * Data-access layer for generated posts and their embeddings.
 *
 * Kept deliberately thin in Module 1; the post-generator, RAG and
 * feedback modules build on it in later modules.
 */
@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepo: Repository<Post>,
    @InjectRepository(PostEmbedding)
    private readonly embeddingsRepo: Repository<PostEmbedding>,
  ) {}

  /** Persists a generated post record. */
  async createPost(input: CreatePostInput): Promise<Post> {
    const post = this.postsRepo.create({
      userId: input.userId ?? null,
      userPrompt: input.userPrompt,
      finalPrompt: input.finalPrompt ?? null,
      imagePath: input.imagePath ?? null,
    });
    return this.postsRepo.save(post);
  }

  /** Fetches one post by id, or null when it does not exist. */
  async findPostById(id: string): Promise<Post | null> {
    return this.postsRepo.findOne({ where: { id } });
  }

  /** Most recent posts, newest first (used by the test UI and list endpoint). */
  async listPosts(limit = 20): Promise<Post[]> {
    return this.postsRepo.find({ order: { createdAt: 'DESC' }, take: limit });
  }

  /** Stores a 1–5 rating (feedback loop, Module 4). */
  async setRating(id: string, rating: number): Promise<Post | null> {
    await this.postsRepo.update({ id }, { rating });
    return this.findPostById(id);
  }

  /** Direct access for the RAG modules (Module 3). */
  get embeddingRepository(): Repository<PostEmbedding> {
    return this.embeddingsRepo;
  }

  /** Direct access for the RAG modules (Module 3). */
  get postRepository(): Repository<Post> {
    return this.postsRepo;
  }
}