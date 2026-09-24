import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class AnalyzeUrlDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl({}, { message: 'A valid website URL is required.' })
  url!: string;
}
