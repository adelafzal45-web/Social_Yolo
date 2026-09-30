import './env';

import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { Post } from '../posts/entities/post.entity';
import { PostEmbedding } from '../posts/entities/post-embedding.entity';
import { StyleReference } from '../style-references/entities/style-reference.entity';
import { User } from '../users/entities/user.entity';
import { BrandProfile } from '../brands/entities/brand-profile.entity';
import { CreditTransaction } from '../billing/entities/credit-transaction.entity';
import { Notification } from '../notifications/entities/notification.entity';

/**
 * TypeORM connection to the project Postgres database ("Social Yolo").
 * Synchronize: true auto-updates tables as entities evolve.
 */
export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD ?? 'admin',
  database: process.env.DB_NAME || 'Social Yolo',
  entities: [
    User,
    Post,
    PostEmbedding,
    StyleReference,
    BrandProfile,
    CreditTransaction,
    Notification,
  ],
  // Only auto-synchronize schema during development to prevent data loss in production
  synchronize: process.env.NODE_ENV !== 'production',
  logging: ['error', 'warn'],
};
