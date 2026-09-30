import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Form fields accepted by `POST /api/style-references` (multipart/form-data).
 *
 * The image itself arrives on the `file` field; everything here is metadata
 * that gets merged into the embedded `content_text` alongside the AI's own
 * visual analysis of the picture.
 */
export class CreateStyleReferenceDto {
  @ApiProperty({
    required: false,
    description: 'Short human label for the reference',
    example: 'Editorial skincare hero — soft beige studio',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiProperty({
    required: false,
    description:
      'Why this reference is good — what should the model imitate from it?',
    example: 'Loved this lighting and the way the type sits in the lower third.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiProperty({
    required: false,
    description:
      'Design category used for scoped retrieval (beauty, food, fashion, tech…)',
    example: 'beauty',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty({
    required: false,
    description: 'Comma-separated keywords used for lexical boosting',
    example: 'beige, editorial, soft-light, serif',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  tags?: string;

  @ApiProperty({
    required: false,
    description: 'Extra instruction for the visual analyser',
    example: 'Use this as a composition reference, not a colour reference.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  hint?: string;
}

/** Body of `PATCH /api/style-references/:id` — every field is optional. */
export class UpdateStyleReferenceDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty({ required: false, description: 'Comma-separated keywords' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  tags?: string;

  @ApiProperty({ required: false, description: 'false deactivates the entry' })
  @IsOptional()
  @IsString()
  isActive?: string;

  @ApiProperty({ required: false, description: 'Set true to recompute the embedding' })
  @IsOptional()
  @IsString()
  reindex?: string;
}

/** Query string of `GET /api/style-references`. */
export class ListStyleReferencesDto {
  @ApiProperty({
    required: false,
    enum: ['all', 'global', 'mine'],
    description:
      '`mine` = only the caller\'s own uploads, `global` = only the curated pool',
  })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiProperty({ required: false, description: 'Exact category filter' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false, description: 'Free-text search over title/notes/tags' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, description: 'Include deactivated entries' })
  @IsOptional()
  @IsString()
  includeInactive?: string;
}

/** Body of `POST /api/style-references/bulk` (JSON, no image upload). */
export class BulkCreateStyleReferenceDto {
  @ApiProperty({ description: 'References to create' })
  @IsNotEmpty()
  items!: Array<{
    title?: string;
    notes?: string;
    category?: string;
    tags?: string;
    imageUrl?: string;
  }>;
}
