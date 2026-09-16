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
    description: 'The short text the user typed.',
    example: 'Eid sale post',
  })
  userPrompt!: string;

  @ApiProperty({
    description:
      'Design category the post was generated for (gym, food, education…).',
    example: 'gym',
    nullable: true,
    required: false,
  })
  category?: string | null;

  @ApiProperty({
    description: 'Requested post size/format key used for the design.',
    example: 'instagram_post',
    nullable: true,
    required: false,
  })
  postSize?: string | null;

  @ApiProperty({
    description: 'Requested output file type of the post.',
    example: 'png',
    enum: ['jpg', 'png'],
    nullable: true,
    required: false,
  })
  outputType?: string | null;

  @ApiProperty({
    description:
      'Actual MIME type of the stored image — may differ from the requested ' +
      'outputType when the engine cannot emit that format.',
    example: 'image/png',
    required: false,
  })
  format?: string;

  @ApiProperty({
    description:
      'Structured design brief captured with the request (content copy, color ' +
      'scheme, font, …) for future dynamic handling.',
    nullable: true,
    required: false,
    type: Object,
  })
  designBrief?: Record<string, unknown> | null;

  @ApiProperty({
    description:
      'The full designer-style prompt that was actually sent to Gemini.',
    nullable: true,
  })
  finalPrompt!: string | null;

  @ApiProperty({
    description: 'User rating 1–5; null until rated.',
    nullable: true,
  })
  rating!: number | null;

  @ApiProperty({
    description: 'Which image engine produced this post.',
    enum: ['gemini', 'pollinations'],
    required: false,
  })
  engine?: 'gemini' | 'pollinations';

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
