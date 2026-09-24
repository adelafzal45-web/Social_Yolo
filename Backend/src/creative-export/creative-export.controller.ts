import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreativeExportService, ExportRequestDto } from './creative-export.service';

@ApiTags('creative-export')
@Controller('creative-export')
export class CreativeExportController {
  constructor(private readonly exportService: CreativeExportService) {}

  @Post('export')
  @ApiOperation({ summary: 'Export a creative variation to PNG, JPG, or WebP' })
  async exportCreative(@Body() dto: ExportRequestDto) {
    return this.exportService.exportCreative(dto);
  }
}
