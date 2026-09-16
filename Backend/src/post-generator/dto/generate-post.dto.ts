import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

import { POST_OUTPUT_TYPES, POST_SIZE_KEYS } from '../design-brief';

/**
 * Body for `POST /api/posts/generate` (the two images are separate
 * multipart parts: `file` = optional subject, `logo` = optional company
 * logo). Every field except `prompt` is optional — the final designer
 * prompt is built dynamically from whatever the user provided.
 */
export class GeneratePostDto {
  @ApiProperty({
    description:
      'Short description of the post you want (the post idea/brief). The backend ' +
      'expands this into a full designer-style prompt automatically (RAG prompt builder).',
    example: 'Eid sale post with 50% discount',
    maxLength: 300,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  prompt!: string;

  @ApiProperty({
    description:
      'The exact copy/text to write ON the post (headline, offer, CTA…). Rendered ' +
      'verbatim by the design model. Omit to let the model invent suitable text.',
    example: 'MEGA SALE — 50% OFF | Shop now',
    required: false,
    maxLength: 600,
  })
  @IsOptional()
  @IsString()
  @MaxLength(600)
  content?: string;

  @ApiProperty({
    description:
      'Brand color scheme for the design (names, hex codes or a description). ' +
      'Applied consistently across background, accents and text.',
    example: 'navy blue background with orange accents, white text',
    required: false,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  colorScheme?: string;

  @ApiProperty({
    description:
      'Font to use for ALL text on the post (e.g. Montserrat, Poppins, Bebas Neue).',
    example: 'Montserrat',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  font?: string;

  @ApiProperty({
    description:
      'Design category of the post (gym, education, drinks, food… — free text). ' +
      'Steers the design language AND scopes RAG retrieval: style references are ' +
      'taken ONLY from past posts of this same category.',
    example: 'gym',
    required: false,
    maxLength: 60,
  })
  @IsOptional()
  @IsString()
  @Length(1, 60)
  category?: string;

  @ApiProperty({
    description:
      'Post size/format — sets the exact canvas the design must fill. ' +
      `One of: ${POST_SIZE_KEYS.join(', ')}. Defaults to instagram_post.`,
    example: 'instagram_post',
    enum: POST_SIZE_KEYS,
    required: false,
  })
  @IsOptional()
  @IsIn(POST_SIZE_KEYS as unknown as string[])
  postSize?: string;

  @ApiProperty({
    description: 'Output file type of the generated post. Defaults to png.',
    example: 'png',
    enum: POST_OUTPUT_TYPES,
    required: false,
  })
  @IsOptional()
  @IsIn(POST_OUTPUT_TYPES as unknown as string[])
  outputType?: string;

  @ApiProperty({
    description:
      "Free-form design/concept instructions (layout mood, style ideas, do/don'ts) " +
      'fed to the AI art-director planning pass.',
    example:
      'luxury minimal look, product floating on a podium, golden-hour lighting',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  designConcept?: string;
}
