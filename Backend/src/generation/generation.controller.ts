import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { GenerationService, StartGenerationDto } from './generation.service';

@ApiTags('generation')
@Controller('generation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  @Post('jobs')
  @ApiOperation({
    summary: 'Initiate asynchronous creative generation pipeline',
  })
  async startJob(
    @CurrentUser() user: AuthUser,
    @Body() dto: StartGenerationDto,
  ) {
    return this.generationService.startJob(user.organizationId, dto, user.id);
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get current generation job status and progress' })
  async getJobStatus(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.generationService.getJobStatus(user.organizationId, id);
  }

  @Get('jobs/:id/stream')
  @ApiOperation({
    summary: 'Server-Sent Events (SSE) real-time job progress stream',
  })
  streamJobProgress(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const stream = this.generationService.getJobStream(id);
    const subscription = stream.subscribe({
      next: (event) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      },
      complete: () => {
        res.write(`data: ${JSON.stringify({ finished: true })}\n\n`);
        res.end();
      },
      error: (err) => {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
      },
    });

    res.on('close', () => {
      subscription.unsubscribe();
    });
  }
}
