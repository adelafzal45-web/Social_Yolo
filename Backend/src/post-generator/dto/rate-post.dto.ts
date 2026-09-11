import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

/** Body for `POST /api/posts/:id/rate`. */
export class RatePostDto {
  @ApiProperty({
    description:
      'Rating from 1 (poor) to 5 (excellent). Ratings of 4 or 5 add the post ' +
      'to your personal RAG style pool; lower ratings remove it.',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;
}