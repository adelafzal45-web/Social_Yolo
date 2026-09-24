import { ApiProperty } from '@nestjs/swagger';

/** Uniform response shape for generated posts. */
export class PostResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: 'ede9009c-4062-4664-afe2-5737ae475bf7',
  })
  id!: string;

  @ApiProperty({
    description:
      'URL of the generated post image (served from Backend/public).',
    example: '/generated-posts/ede9009c-4062-4664-afe2-5737ae475bf7.png',
    nullable: true,
  })
  imageUrl!: string | null;

  @ApiProperty({
    description:
      'URL of original uploaded subject photo (served from Backend/public).',
    required: false,
    nullable: true,
  })
  originalImageUrl?: string | null;

  @ApiProperty({
    description: 'The short text the user typed or prompt summary.',
    example: 'Summer Solstice Sale',
  })
  userPrompt!: string;

  @ApiProperty({
    description:
      'The full designer-style prompt that was actually sent to the image engine.',
    nullable: true,
  })
  finalPrompt!: string | null;

  @ApiProperty({ required: false, nullable: true })
  title?: string | null;

  @ApiProperty({ required: false, nullable: true })
  productName?: string | null;

  @ApiProperty({ required: false, nullable: true })
  niche?: string | null;

  @ApiProperty({ required: false, default: 'instagram' })
  platform?: string;

  @ApiProperty({ required: false, default: '1:1' })
  aspectRatio?: string;

  @ApiProperty({ required: false, default: 'luxury' })
  style?: string;

  @ApiProperty({ required: false, nullable: true })
  occasion?: string | null;

  @ApiProperty({ required: false, default: 'ai_replace' })
  backgroundMode?: string;

  @ApiProperty({ required: false, nullable: true })
  headline?: string | null;

  @ApiProperty({ required: false, nullable: true })
  bodyCopy?: string | null;

  @ApiProperty({ required: false, nullable: true })
  category?: string | null;

  @ApiProperty({ required: false, nullable: true })
  content?: string | null;

  @ApiProperty({ required: false, nullable: true })
  colorScheme?: string | null;

  @ApiProperty({ required: false, nullable: true })
  font?: string | null;

  @ApiProperty({ required: false, nullable: true })
  postSize?: string | null;

  @ApiProperty({ required: false, default: 'png' })
  outputType?: string;

  @ApiProperty({ required: false, description: 'Actual emitted image format' })
  format?: string;

  @ApiProperty({ required: false, nullable: true })
  logoUrl?: string | null;

  @ApiProperty({ required: false, nullable: true })
  designBrief?: Record<string, any> | null;

  @ApiProperty({
    description: 'User rating 1–5; null until rated.',
    nullable: true,
  })
  rating!: number | null;

  @ApiProperty({ required: false, default: false })
  isFavorite?: boolean;

  @ApiProperty({
    description: 'Which image engine produced this post.',
    required: false,
  })
  engine?: string | null;

  @ApiProperty({ required: false, default: 'completed' })
  status?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
