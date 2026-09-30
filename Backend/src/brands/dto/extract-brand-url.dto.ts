import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ExtractBrandUrlDto {
  @ApiProperty({
    example: 'https://apple.com',
    description:
      'Company website URL or domain name to analyze and extract brand details from',
  })
  @IsNotEmpty({ message: 'Website URL is required' })
  @IsString({ message: 'Website URL must be a valid string' })
  url!: string;
}
