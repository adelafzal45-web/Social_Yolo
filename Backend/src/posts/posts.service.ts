import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { unlink } from 'fs/promises';
import { resolve } from 'path';

import { Post } from './entities/post.entity';
import { PostEmbedding } from './entities/post-embedding.entity';
import { RedisCacheService } from '../common/cache/redis-cache.service';

/** Data needed to persist one generated post. */
export interface CreatePostInput {
  userId?: string | null;
  brandProfileId?: string | null;
  title?: string | null;
  productName?: string | null;
  niche?: string | null;
  platform?: string;
  aspectRatio?: string;
  style?: string;
  occasion?: string | null;
  backgroundMode?: string;
  headline?: string | null;
  bodyCopy?: string | null;
  category?: string | null;
  content?: string | null;
  colorScheme?: string | null;
  font?: string | null;
  postSize?: string | null;
  outputType?: string;
  logoPath?: string | null;
  designBrief?: Record<string, any> | null;
  userPrompt: string;
  finalPrompt?: string | null;
  originalImagePath?: string | null;
  imagePath?: string | null;
  engine?: string | null;
  status?: string;
}

export interface ListPostsFilter {
  userId?: string | null;
  platform?: string;
  style?: string;
  search?: string;
  favoritesOnly?: boolean;
  limit?: number;
  offset?: number;
}

const isUuid = (val?: string): boolean =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim()));

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepo: Repository<Post>,
    @InjectRepository(PostEmbedding)
    private readonly embeddingsRepo: Repository<PostEmbedding>,
    private readonly cache: RedisCacheService,
  ) {}

  private async resolveUuid(candidateId?: string | null): Promise<string | null> {
    if (!candidateId || !candidateId.trim()) return null;
    const cleanId = candidateId.trim();
    if (isUuid(cleanId)) return cleanId;
    try {
      const rows = await this.postsRepo.query(
        `SELECT id FROM public.users 
         WHERE better_auth_id = $1 
            OR id::text = $1 
            OR EXISTS (SELECT 1 FROM "user" bu WHERE bu.id = $1 AND LOWER(bu.email) = LOWER(public.users.email))
         LIMIT 1`,
        [cleanId],
      );
      return rows?.[0]?.id || null;
    } catch {
      return null;
    }
  }

  /** Persists a generated post record. */
  async createPost(input: CreatePostInput): Promise<Post> {
    const post = this.postsRepo.create({
      userId: input.userId ?? null,
      brandProfileId: input.brandProfileId ?? null,
      title:
        input.title ??
        (input.productName
          ? `${input.productName} — ${input.platform || 'Post'}`
          : null),
      productName: input.productName ?? null,
      niche: input.niche ?? null,
      platform: input.platform || 'instagram',
      aspectRatio: input.aspectRatio || '1:1',
      style: input.style || 'luxury',
      occasion: input.occasion ?? null,
      backgroundMode: input.backgroundMode || 'ai_replace',
      headline: input.headline ?? null,
      bodyCopy: input.bodyCopy ?? null,
      category: input.category
        ? input.category.trim().toLowerCase()
        : input.niche
          ? input.niche.trim().toLowerCase()
          : null,
      content: input.content ?? null,
      colorScheme: input.colorScheme ?? null,
      font: input.font ?? null,
      postSize: input.postSize ?? null,
      outputType: input.outputType || 'png',
      logoPath: input.logoPath ?? null,
      designBrief: input.designBrief ?? null,
      userPrompt: input.userPrompt,
      finalPrompt: input.finalPrompt ?? null,
      originalImagePath: input.originalImagePath ?? null,
      imagePath: input.imagePath ?? null,
      engine: input.engine ?? null,
      status: input.status || 'completed',
    });
    const saved = await this.postsRepo.save(post);
    await this.cache.delPattern('posts:*');
    return saved;
  }

  /** Fetches one post by id with Redis cache. */
  async findPostById(id: string): Promise<Post | null> {
    const cacheKey = `posts:id:${id}`;
    const cached = await this.cache.get<Post>(cacheKey);
    if (cached) return cached;

    const post = await this.postsRepo.findOne({
      where: { id },
      relations: ['brandProfile'],
    });

    if (post) {
      await this.cache.set(cacheKey, post, 60);
    }
    return post;
  }

  /** Lists posts with rich filters, search, and pagination (cached). */
  async listPostsFiltered(
    filter: ListPostsFilter,
  ): Promise<{ items: Post[]; total: number }> {
    const cacheKey = `posts:filter:${JSON.stringify(filter)}`;
    const cached = await this.cache.get<{ items: Post[]; total: number }>(
      cacheKey,
    );
    if (cached) return cached;

    const take =
      filter.limit && filter.limit > 0 ? Math.min(filter.limit, 100) : 24;
    const skip = filter.offset && filter.offset > 0 ? filter.offset : 0;

    const where: FindOptionsWhere<Post> = {};

    if (filter.userId) {
      const validUserId = await this.resolveUuid(filter.userId);
      where.userId = validUserId || undefined;
    }
    if (filter.platform && filter.platform !== 'all') {
      where.platform = filter.platform.toLowerCase();
    }
    if (filter.style && filter.style !== 'all') {
      where.style = filter.style.toLowerCase();
    }
    if (filter.favoritesOnly) {
      where.isFavorite = true;
    }
    if (filter.search) {
      where.userPrompt = ILike(`%${filter.search}%`);
    }

    const [items, total] = await this.postsRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take,
      skip,
      relations: ['brandProfile'],
    });

    const result = { items, total };
    await this.cache.set(cacheKey, result, 30);
    return result;
  }

  /** Simple backward-compatible list. */
  async listPosts(limit = 24): Promise<Post[]> {
    const cacheKey = `posts:limit:${limit}`;
    const cached = await this.cache.get<Post[]>(cacheKey);
    if (cached) return cached;

    const items = await this.postsRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['brandProfile'],
    });
    await this.cache.set(cacheKey, items, 30);
    return items;
  }

  /** Toggle favorite status. */
  async toggleFavorite(id: string): Promise<Post> {
    const post = await this.postsRepo.findOne({
      where: { id },
      relations: ['brandProfile'],
    });
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found.`);
    }
    post.isFavorite = !post.isFavorite;
    const saved = await this.postsRepo.save(post);
    await this.cache.del(`posts:id:${id}`);
    await this.cache.delPattern('posts:*');
    return saved;
  }

  /** List only favorited posts. */
  async listFavorites(userId?: string): Promise<Post[]> {
    const validUserId = userId ? await this.resolveUuid(userId) : undefined;
    const cacheKey = `posts:favorites:${validUserId || 'all'}`;
    const cached = await this.cache.get<Post[]>(cacheKey);
    if (cached) return cached;

    const where: FindOptionsWhere<Post> = { isFavorite: true };
    if (validUserId) {
      where.userId = validUserId;
    }
    const items = await this.postsRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50,
      relations: ['brandProfile'],
    });
    await this.cache.set(cacheKey, items, 30);
    return items;
  }

  /** Stores a 1–5 rating (RAG feedback loop). */
  async setRating(id: string, rating: number): Promise<Post | null> {
    if (!isUuid(id)) return null;
    await this.postsRepo.update({ id }, { rating });
    await this.cache.del(`posts:id:${id}`);
    await this.cache.delPattern('posts:*');
    return this.findPostById(id);
  }

  /** Deletes a post and cleans up its physical files from disk. */
  async deletePost(id: string, requestingUserId?: string | null): Promise<{ success: boolean }> {
    if (!isUuid(id)) return { success: false };
    const validUserId = requestingUserId ? await this.resolveUuid(requestingUserId) : null;
    const post = await this.postsRepo.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found.`);
    }

    if (post.userId && validUserId && post.userId !== validUserId) {
      throw new ForbiddenException('You do not have permission to delete this post.');
    }

    // Clean up physical files on disk
    const filesToDelete = [post.imagePath, post.originalImagePath, post.logoPath].filter(Boolean) as string[];
    for (const relPath of filesToDelete) {
      try {
        const fullPath = resolve(process.cwd(), 'public', relPath);
        await unlink(fullPath).catch(() => {});
      } catch {}
    }

    await this.postsRepo.remove(post);
    await this.cache.del(`posts:id:${id}`);
    await this.cache.delPattern('posts:*');
    return { success: true };
  }

  get embeddingRepository(): Repository<PostEmbedding> {
    return this.embeddingsRepo;
  }

  get postRepository(): Repository<Post> {
    return this.postsRepo;
  }
}
