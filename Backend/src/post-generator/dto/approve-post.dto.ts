import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

/** Body for `POST /api/posts/:id/approve`. */
export class ApprovePostDto {
  @ApiProperty({
    required: false,
    description:
      'true to approve (add to the RAG knowledge base), false to withdraw approval. ' +
      'Defaults to true.',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  approved?: boolean;
}
