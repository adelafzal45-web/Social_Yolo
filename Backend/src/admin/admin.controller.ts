import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsBoolean, IsIn } from 'class-validator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import type { AppRole } from '../auth/profiles/profile-role.util';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequireRoles } from '../auth/decorators/permissions.decorator';
import { CreateAdminUserDto, UpdateAdminUserDto } from './dto/admin-user.dto';

class SetRoleDto {
  @IsIn(['USER', 'ADMIN'])
  role!: AppRole;
}

class SetStatusDto {
  @IsBoolean()
  isActive!: boolean;
}

/**
 * Administrative Controller.
 * Protected by JwtAuthGuard and PermissionsGuard:
 * EVERY endpoint requires an active session AND server-verified ADMIN role.
 * Any non-ADMIN user receives HTTP 403 Forbidden.
 */
@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequireRoles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'List all registered users with billing information (admin only)' })
  async listUsers(
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const lim = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const allUsers = await this.adminService.listProfiles(search, lim);
    return {
      users: allUsers,
      total: allUsers.length,
    };
  }

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register and create a new user account (admin only)' })
  async createUser(@Body() dto: CreateAdminUserDto) {
    return this.adminService.createUser(dto);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user account details and subscription (admin only)' })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserDto,
  ) {
    return this.adminService.updateUser(id, dto);
  }

  @Get('users/:id/billing')
  @ApiOperation({ summary: 'Get user billing, subscription, and payments (admin only)' })
  async getUserBilling(@Param('id') id: string) {
    return this.adminService.getUserBilling(id);
  }

  @Get('profiles')
  @ApiOperation({ summary: 'List profiles alias (admin only)' })
  listProfiles(@Query('search') search?: string) {
    return this.adminService.listProfiles(search);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Assign USER or ADMIN role to an account (admin only)' })
  setRole(@Param('id') id: string, @Body() body: SetRoleDto) {
    return this.adminService.setRole(id, body.role);
  }

  @Patch('profiles/:id/role')
  @ApiOperation({ summary: 'Assign USER or ADMIN role alias (admin only)' })
  setProfileRole(@Param('id') id: string, @Body() body: SetRoleDto) {
    return this.adminService.setRole(id, body.role);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Toggle account activation status (admin only)' })
  setStatus(@Param('id') id: string, @Body() body: SetStatusDto) {
    return this.adminService.setStatus(id, body.isActive);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user account (admin only)' })
  async deleteUser(@Param('id') id: string) {
    await this.adminService.deleteUser(id);
    return { success: true, message: `User ${id} has been deleted.` };
  }
}
