import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Body for `POST /api/posts/:id/edit` — the user's change request. */
export class EditPostDto {
  @ApiProperty({
    description:
      'Plain-language description of the changes to apply to the existing image. ' +
      'Only what the user asks for is changed; everything else is preserved.',
    example:
      'Make the background warmer and darker, and move the product slightly to the right.',
    maxLength: 600,
  })
  @IsString()
  @IsNotEmpty({ message: 'Describe the changes you want to make.' })
  @MaxLength(600, {
    message: 'instructions must be 600 characters or fewer',
  })
  instructions!: string;
}
