import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { TeamsService } from './teams.service';

@ApiTags('team')
@Controller('team')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @ApiOperation({ summary: 'List all team members for current organization' })
  async getTeamMembers(@CurrentUser() user: AuthUser) {
    return this.teamsService.getTeamMembers(user.organizationId);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite a new member to the organization' })
  async inviteMember(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      email: string;
      fullName: string;
      role?: 'ADMIN' | 'CREATOR' | 'GUEST';
    },
  ) {
    return this.teamsService.inviteMember(
      user.organizationId,
      body.email,
      body.fullName,
      body.role,
    );
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Update a member role' })
  async updateRole(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { role: string },
  ) {
    return this.teamsService.updateRole(user.organizationId, id, body.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a member from the organization' })
  async removeMember(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.teamsService.removeMember(user.organizationId, id);
  }
}
