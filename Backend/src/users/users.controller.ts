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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from './entities/user.entity';
import { UsersService } from './users.service';
import { AdminService } from '../admin/admin.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { CreateAdminUserDto, UpdateAdminUserDto } from '../admin/dto/admin-user.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly adminService: AdminService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all users (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'List of users with pagination metadata.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required).' })
  async listUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const all = await this.adminService.listProfiles(search, limitNum);
    return {
      users: all,
      total: all.length,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register and create a new user account (Admin only)' })
  async createUser(@Body() dto: CreateAdminUserDto) {
    return this.adminService.createUser(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user account details and subscription (Admin only)' })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserDto,
  ) {
    return this.adminService.updateUser(id, dto);
  }

  @Get(':id/billing')
  @ApiOperation({ summary: 'Get user billing, subscription, and payments (Admin only)' })
  async getUserBilling(@Param('id') id: string) {
    return this.adminService.getUserBilling(id);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Update a user role (Admin only)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'User role updated successfully.' })
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    const user = await this.adminService.setRole(id, dto.role.toUpperCase() as any);
    return user;
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activate or deactivate a user (Admin only)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({
    status: 200,
    description: 'User status updated successfully.',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    const user = await this.adminService.setStatus(id, dto.isActive);
    return user;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user account (Admin only)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 204, description: 'User deleted successfully.' })
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser('id') currentAdminId: string,
  ) {
    await this.usersService.deleteUser(id, currentAdminId);
  }
}
