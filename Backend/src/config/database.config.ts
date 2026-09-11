import './env';

import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { Post } from '../posts/entities/post.entity';
import { PostEmbedding } from '../posts/entities/post-embedding.entity';

/**
 * TypeORM connection to the project Postgres database ("Social Yolo").
 *
 * Credentials come from `.env` (`DB_*` variables) so nothing secret is
 * hard-coded here. `synchronize: true` auto-creates/updates tables from
 * the entities during development — switch to migrations before this
 * ever runs in production.
 */
export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME || 'Social Yolo',
  entities: [Post, PostEmbedding],
  synchronize: true,
  logging: ['error', 'warn'],
};