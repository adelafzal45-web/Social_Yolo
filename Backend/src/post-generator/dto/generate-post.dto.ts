import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Body for `POST /api/posts/generate` (file is a separate multipart part). */
export class GeneratePostDto {
  @ApiProperty({
    description:
      'Short description of the post you want. The backend expands this into a ' +
      'full designer-style prompt automatically (RAG prompt builder).',
    example: 'Eid sale post with 50% discount',
    maxLength: 300,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  prompt!: string;
}