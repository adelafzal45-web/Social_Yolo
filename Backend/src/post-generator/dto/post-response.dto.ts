import { ApiProperty } from '@nestjs/swagger';

/** Uniform response shape for generated posts. */
export class PostResponseDto {
  @ApiProperty({ format: 'uuid', example: 'ede9009c-4062-4664-afe2-5737ae475bf7' })
  id!: string;

  @ApiProperty({
    description: 'URL of the generated post image (served from Backend/public).',
    example: '/generated-posts/ede9009c-4062-4664-afe2-5737ae475bf7.png',
    nullable: true,
  })
  imageUrl!: string | null;

  @ApiProperty({ description: 'The short text the user typed.', example: 'Eid sale post' })
  userPrompt!: string;

  @ApiProperty({
    description: 'The full designer-style prompt that was actually sent to Gemini.',
    nullable: true,
  })
  finalPrompt!: string | null;

  @ApiProperty({ description: 'User rating 1–5; null until rated.', nullable: true })
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