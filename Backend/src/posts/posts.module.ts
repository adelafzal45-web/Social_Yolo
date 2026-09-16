import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Post } from './entities/post.entity';
import { PostEmbedding } from './entities/post-embedding.entity';
import { PostImageEmbedding } from './entities/post-image-embedding.entity';
import { PostsService } from './posts.service';

/**
 * Database feature module for the AI Post Generator: registers the
 * `posts` and `post_embeddings` entities and exposes `PostsService`.
 *
 * The `TypeOrmModule.forFeature` registration is RE-EXPORTED so that any
 * module importing `PostsModule` (e.g. `PostGeneratorModule`) can inject
 * the repositories directly.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostEmbedding, PostImageEmbedding]),
  ],
  providers: [PostsService],
  exports: [
    TypeOrmModule.forFeature([Post, PostEmbedding, PostImageEmbedding]),
    PostsService,
  ],
})
export class PostsModule {}
