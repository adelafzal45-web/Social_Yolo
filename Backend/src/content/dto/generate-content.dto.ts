import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class GenerateContentDto {
  @IsNotEmpty()
  @IsString()
  brandId: string;

  @IsNotEmpty()
  @IsString()
  platform: string;

  @IsNotEmpty()
  @IsString()
  contentType: string; // 'Social Post' | 'Carousel' | 'Story' | 'Flyer' | 'Ad'

  @IsNotEmpty()
  @IsString()
  goal: string; // 'Awareness' | 'Engagement' | 'Sales' | 'Launch' | 'Educational'

  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsString()
  campaign?: string;

  @IsOptional()
  @IsString()
  audience?: string;

  @IsOptional()
  @IsString()
  contentPillar?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  tone?: string;

  @IsOptional()
  @IsNumber()
  variationsCount?: number;

  @IsOptional()
  @IsString()
  additionalNotes?: string;
}
