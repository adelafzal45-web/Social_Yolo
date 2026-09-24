import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DesignReference } from './entities/design-reference.entity';
import { DesignReferenceEmbedding } from './entities/design-reference-embedding.entity';
import { DesignReferencePattern } from './entities/design-reference-pattern.entity';
import { DesignReferenceTag } from './entities/design-reference-tag.entity';
import { DesignReferenceAsset } from './entities/design-reference-asset.entity';
import { DesignReferencesService } from './design-references.service';
import { DesignReferencesController } from './design-references.controller';
import { DesignReferenceAdminController } from './design-reference-admin.controller';
import { DesignInspirationsController } from './design-inspirations.controller';
import { InternalLibraryProvider } from './providers/internal-library.provider';
import { PinterestProvider } from './providers/pinterest.provider';
import { BehanceProvider } from './providers/behance.provider';
import { UserUploadProvider } from './providers/user-upload.provider';
import { GeneratedDesignProvider } from './providers/generated-design.provider';
import { EmbeddingsService } from '../post-generator/rag/embeddings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DesignReference,
      DesignReferenceEmbedding,
      DesignReferencePattern,
      DesignReferenceTag,
      DesignReferenceAsset,
    ]),
  ],
  controllers: [
    DesignReferencesController,
    DesignReferenceAdminController,
    DesignInspirationsController,
  ],
  providers: [
    DesignReferencesService,
    InternalLibraryProvider,
    PinterestProvider,
    BehanceProvider,
    UserUploadProvider,
    GeneratedDesignProvider,
    EmbeddingsService,
  ],
  exports: [DesignReferencesService],
})
export class DesignReferencesModule {}
