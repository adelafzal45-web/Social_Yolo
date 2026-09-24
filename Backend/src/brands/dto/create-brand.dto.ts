import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  brandName?: string;

  @IsString()
  @IsOptional()
  workspaceId?: string;

  @IsString()
  @IsOptional()
  tagline?: string;

  @IsString()
  @IsOptional()
  niche?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  websiteUrl?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  primaryColor?: string;

  @IsString()
  @IsOptional()
  secondaryColor?: string;

  @IsString()
  @IsOptional()
  accentColor?: string;

  @IsString()
  @IsOptional()
  fontHeading?: string;

  @IsString()
  @IsOptional()
  fontBody?: string;

  @IsString()
  @IsOptional()
  tone?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  /* ──── New Intelligence Engine Fields ──── */

  @IsString()
  @IsOptional()
  industry?: string;

  @IsString()
  @IsOptional()
  subIndustry?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  faviconUrl?: string;

  @IsArray()
  @IsOptional()
  secondaryColors?: string[];

  @IsObject()
  @IsOptional()
  socialLinks?: Record<string, string>;

  @IsObject()
  @IsOptional()
  brandVoice?: Record<string, any>;

  @IsString()
  @IsOptional()
  status?: string;

  @IsObject()
  @IsOptional()
  insights?: Record<string, any>;
}
