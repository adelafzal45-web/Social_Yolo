import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import {
  ProjectsService,
  CreateProjectDto,
  UpdateProjectDto,
  UpdateCreativeVariantDto,
} from './projects.service';

@ApiTags('projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  private resolveOrgId(user: AuthUser): string {
    return user?.organizationId || user?.id || 'd0cf85ae-ed2c-486a-889d-27dca93daa66';
  }

  @Get()
  @ApiOperation({ summary: 'List all projects for current organization' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'clientFolder', required: false })
  @ApiQuery({ name: 'brandId', required: false })
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('clientFolder') clientFolder?: string,
    @Query('brandId') brandId?: string,
  ) {
    return this.projectsService.findAll(this.resolveOrgId(user), {
      status,
      clientFolder,
      brandId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project with its creative variants' })
  async findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.projectsService.findOne(this.resolveOrgId(user), id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(this.resolveOrgId(user), dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project settings, copy, or parameters' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(this.resolveOrgId(user), id, dto);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate an existing project and its variants' })
  async duplicate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.projectsService.duplicate(this.resolveOrgId(user), id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.projectsService.remove(this.resolveOrgId(user), id);
  }

  @Patch('creatives/:creativeId')
  @ApiOperation({
    summary: 'Update a specific creative variant (copy, style, or approval)',
  })
  async updateCreativeVariant(
    @CurrentUser() user: AuthUser,
    @Param('creativeId') creativeId: string,
    @Body() dto: UpdateCreativeVariantDto,
  ) {
    return this.projectsService.updateCreativeVariant(
      this.resolveOrgId(user),
      creativeId,
      dto,
    );
  }
}
