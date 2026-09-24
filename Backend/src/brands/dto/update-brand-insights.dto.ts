import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateBrandInsightsDto {
  @IsString()
  @IsOptional()
  companyDescription?: string;

  @IsString()
  @IsOptional()
  valueProposition?: string;

  @IsArray()
  @IsOptional()
  products?: Record<string, any>[];

  @IsArray()
  @IsOptional()
  services?: Record<string, any>[];

  @IsArray()
  @IsOptional()
  targetAudience?: Record<string, any>[];

  @IsArray()
  @IsOptional()
  locations?: Record<string, any>[];

  @IsArray()
  @IsOptional()
  benefits?: string[];

  @IsArray()
  @IsOptional()
  painPoints?: string[];

  @IsArray()
  @IsOptional()
  keywords?: string[];

  @IsArray()
  @IsOptional()
  categories?: string[];

  @IsObject()
  @IsOptional()
  socialLinks?: Record<string, string>;

  @IsObject()
  @IsOptional()
  brandVoice?: Record<string, any>;
}
