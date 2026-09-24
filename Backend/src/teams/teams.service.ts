import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../database/entities';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getTeamMembers(organizationId: string) {
    const users = await this.userRepo.find({
      where: { organizationId },
      order: { createdAt: 'ASC' },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.fullName,
      email: u.email,
      role: u.role,
      avatarUrl: u.avatarUrl,
      joinedDate: u.createdAt.toISOString().slice(0, 10),
      status: u.isActive ? 'Active' : 'Inactive',
    }));
  }

  async inviteMember(
    organizationId: string,
    email: string,
    fullName: string,
    role: 'ADMIN' | 'CREATOR' | 'GUEST' = 'CREATOR',
  ) {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const existing = await this.userRepo.findOne({
      where: { email: normalizedEmail },
    });
    if (existing) {
      throw new BadRequestException(
        `User with email "${normalizedEmail}" already exists.`,
      );
    }

    const defaultPassword = 'User@123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    let permissions = ['image:view'];
    if (role === 'ADMIN') {
      permissions = [
        'image:remove-background',
        'image:admin',
        'image:view',
        'project.manage',
        'credits.manage',
      ];
    } else if (role === 'CREATOR') {
      permissions = [
        'image:remove-background',
        'image:view',
        'project.create',
        'creative.generate',
      ];
    }

    const user = this.userRepo.create({
      organizationId,
      email: normalizedEmail,
      fullName: fullName || normalizedEmail.split('@')[0],
      passwordHash,
      role,
      permissions,
      isActive: true,
    });

    const saved = await this.userRepo.save(user);

    return {
      id: saved.id,
      name: saved.fullName,
      email: saved.email,
      role: saved.role,
      joinedDate: saved.createdAt.toISOString().slice(0, 10),
      status: 'Active',
    };
  }

  async updateRole(organizationId: string, userId: string, role: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId, organizationId },
    });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found.`);
    }

    user.role = role;
    if (role === 'ADMIN') {
      user.permissions = [
        'image:remove-background',
        'image:admin',
        'image:view',
        'project.manage',
        'credits.manage',
      ];
    } else if (role === 'CREATOR') {
      user.permissions = [
        'image:remove-background',
        'image:view',
        'project.create',
        'creative.generate',
      ];
    } else {
      user.permissions = ['image:view'];
    }

    const saved = await this.userRepo.save(user);
    return {
      id: saved.id,
      name: saved.fullName,
      email: saved.email,
      role: saved.role,
      status: saved.isActive ? 'Active' : 'Inactive',
    };
  }

  async removeMember(organizationId: string, userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId, organizationId },
    });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found.`);
    }

    await this.userRepo.remove(user);
    return { deleted: true };
  }
}
