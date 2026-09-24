import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Organization,
  User,
  SubscriptionPlan,
  Subscription,
  CreditAccount,
  CreditTransaction,
  Brand,
  RAGDocument,
  RAGChunk,
  Project,
  CreativeVariant,
  GenerationJob,
  AIUsageLog,
  Invoice,
  AuditLog,
} from './entities';
import { SeedService } from './seed.service';

const ALL_ENTITIES = [
  Organization,
  User,
  SubscriptionPlan,
  Subscription,
  CreditAccount,
  CreditTransaction,
  Brand,
  RAGDocument,
  RAGChunk,
  Project,
  CreativeVariant,
  GenerationJob,
  AIUsageLog,
  Invoice,
  AuditLog,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        username: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'admin',
        database: process.env.DATABASE_NAME || 'social_yolo',
        entities: ALL_ENTITIES,
        synchronize: process.env.DATABASE_SYNCHRONIZE !== 'false',
        logging: false,
      }),
    }),
    TypeOrmModule.forFeature(ALL_ENTITIES),
  ],
  providers: [SeedService],
  exports: [TypeOrmModule, SeedService],
})
export class DatabaseModule {}
