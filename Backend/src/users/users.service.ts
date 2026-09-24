import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedInitialAdmin();
  }

  /**
   * Seeds the initial administrator user if no admin exists in the database.
   */
  async seedInitialAdmin(): Promise<void> {
    try {
      const adminEmail = (process.env.ADMIN_EMAIL || 'admin@socialyolo.com')
        .toLowerCase()
        .trim();
      const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

      const existingAdmin = await this.userRepository.findOne({
        where: [{ email: adminEmail }, { role: UserRole.ADMIN }],
      });

      if (!existingAdmin) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(adminPassword, salt);

        const admin = this.userRepository.create({
          email: adminEmail,
          passwordHash,
          name: 'Social Yolo Admin',
          role: UserRole.ADMIN,
          isActive: true,
        });

        await this.userRepository.save(admin);
        this.logger.log(
          `Default administrator seeded successfully: ${adminEmail}`,
        );
      } else {
        this.logger.log(
          `Administrator account verified (${existingAdmin.email})`,
        );
      }
    } catch (error: any) {
      this.logger.error(`Failed to seed administrator: ${error.message}`);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { googleId },
    });
  }

  async resolveToUuid(candidateId?: string | null): Promise<string | null> {
    if (!candidateId || !candidateId.trim()) return null;
    const trimmed = candidateId.trim();
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
      return trimmed;
    }
    const user = await this.findById(trimmed);
    return user ? user.id : null;
  }

  async findById(id: string): Promise<User | null> {
    if (!id || !id.trim()) return null;
    const cleanId = id.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
    if (isUuid) {
      const byId = await this.userRepository.findOne({ where: { id: cleanId } });
      if (byId) return byId;
    }

    // Check by better_auth_id or joined email
    const rows = await this.userRepository.query(
      `SELECT u.* FROM users u 
       WHERE u.better_auth_id = $1 
          OR u.id::text = $1 
          OR EXISTS (SELECT 1 FROM "user" bu WHERE bu.id = $1 AND LOWER(bu.email) = LOWER(u.email))
       LIMIT 1`,
      [cleanId],
    );
    if (rows && rows.length > 0) {
      const r = rows[0];
      return this.userRepository.create({
        id: r.id,
        betterAuthId: r.better_auth_id,
        email: r.email,
        passwordHash: r.password_hash,
        name: r.name,
        role: r.role,
        isActive: r.is_active,
        credits: r.credits,
        plan: r.plan,
        avatarUrl: r.avatar_url,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      });
    }

    // If exists in Better-Auth "user" but not yet in public.users, auto-provision
    const bUsers = await this.userRepository.query(
      `SELECT id, email, name, role, "isActive", image FROM "user" WHERE id = $1 LIMIT 1`,
      [cleanId],
    );
    if (bUsers && bUsers.length > 0) {
      const bu = bUsers[0];
      const inserted = await this.userRepository.query(
        `INSERT INTO public.users (
          id, better_auth_id, email, name, role, is_active, avatar_url, credits, plan, auth_provider, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, LOWER($2), $3, $4, $5, $6, 50, 'free_trial', 'better-auth', NOW(), NOW()
        ) RETURNING *`,
        [
          bu.id,
          bu.email,
          bu.name || bu.email.split('@')[0],
          String(bu.role || 'user').toLowerCase(),
          bu.isActive !== false,
          bu.image || null,
        ],
      );
      if (inserted && inserted.length > 0) {
        const r = inserted[0];
        return this.userRepository.create({
          id: r.id,
          betterAuthId: r.better_auth_id,
          email: r.email,
          passwordHash: r.password_hash,
          name: r.name,
          role: r.role,
          isActive: r.is_active,
          credits: r.credits,
          plan: r.plan,
          avatarUrl: r.avatar_url,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        });
      }
    }

    return null;
  }

  async findByResetToken(hashedToken: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { resetPasswordToken: hashedToken },
    });
  }

  async create(data: {
    email: string;
    passwordHash?: string | null;
    name: string;
    role?: UserRole;
    googleId?: string | null;
    authProvider?: string;
    avatarUrl?: string | null;
  }): Promise<User> {
    const user = this.userRepository.create({
      email: data.email.toLowerCase().trim(),
      passwordHash: data.passwordHash || null,
      name: data.name.trim(),
      role: data.role || UserRole.USER,
      googleId: data.googleId || null,
      authProvider: data.authProvider || 'local',
      avatarUrl: data.avatarUrl || null,
      isActive: true,
      credits: 50,
    });
    return this.userRepository.save(user);
  }

  async update(id: string, partial: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
    const { posts, ...updateData } = partial as any;
    await this.userRepository.update(user.id, updateData);
    const updated = await this.findById(user.id);
    return updated || user;
  }

  async listUsers(
    page = 1,
    limit = 50,
    search?: string,
  ): Promise<{
    users: Array<Omit<User, 'passwordHash' | 'resetPasswordToken'>>;
    total: number;
  }> {
    const where: any = {};
    if (search && search.trim()) {
      where.email = ILike(`%${search.trim()}%`);
    }

    const [users, total] = await this.userRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      select: [
        'id',
        'email',
        'name',
        'role',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });

    return { users, total };
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
    user.role = role;
    const saved = await this.userRepository.save(user);
    await this.userRepository.query(
      `UPDATE "user" SET role = $1, "updatedAt" = NOW() WHERE id = $2 OR LOWER(email) = LOWER($3)`,
      [role.toUpperCase(), id, user.email],
    );
    return saved;
  }

  async toggleStatus(id: string, isActive: boolean): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
    user.isActive = isActive;
    const saved = await this.userRepository.save(user);
    await this.userRepository.query(
      `UPDATE "user" SET "isActive" = $1, "updatedAt" = NOW() WHERE id = $2 OR LOWER(email) = LOWER($3)`,
      [isActive, id, user.email],
    );
    return saved;
  }

  async deleteUser(id: string, currentAdminId: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
    if (user.id === currentAdminId) {
      throw new BadRequestException(
        'Administrators cannot delete their own account.',
      );
    }
    await this.userRepository.delete(user.id);
    await this.userRepository.query(
      `DELETE FROM "user" WHERE id = $1 OR LOWER(email) = LOWER($2)`,
      [id, user.email],
    );
  }
}
