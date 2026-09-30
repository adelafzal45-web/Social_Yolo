import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { StyleReference } from './entities/style-reference.entity';
import { StyleReferenceController } from './style-reference.controller';
import { StyleReferenceService } from './style-reference.service';
import { PostGeneratorModule } from '../post-generator/post-generator.module';

/**
 * Style Reference Library.
 *
 * Imports `PostGeneratorModule` for the RAG trio (embeddings, retriever,
 * prompt builder) and `AuthModule` for JWT verification. Neither of those
 * imports this module, so there is no circular dependency.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([StyleReference]),
    PostGeneratorModule,
    AuthModule,
  ],
  controllers: [StyleReferenceController],
  providers: [StyleReferenceService],
  exports: [StyleReferenceService],
})
export class StyleReferenceModule {}
