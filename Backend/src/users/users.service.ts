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
      const isProd = process.env.NODE_ENV === 'production';
      const adminEmail = (process.env.ADMIN_EMAIL || 'admin@socialyolo.com')
        .toLowerCase()
        .trim();
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (!adminPassword && isProd) {
        this.logger.error(
          'CRITICAL SECURITY: ADMIN_PASSWORD environment variable is not defined in production. Skipping admin auto-seeding to prevent unauthorized access.',
        );
        return;
      }

      if (!adminPassword) {
        this.logger.warn(
          'SECURITY WARNING: Using default ADMIN_PASSWORD (Admin@123456). Set ADMIN_PASSWORD in .env for security.',
        );
      }

      const effectivePassword = adminPassword || 'Admin@123456';

      const existingAdmin = await this.userRepository.findOne({
        where: [{ email: adminEmail }, { role: UserRole.ADMIN }],
      });

      if (!existingAdmin) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(effectivePassword, salt);

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

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
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
    const { posts: _posts, ...updateData } = partial as any;
    await this.userRepository.update(id, updateData);
    const updated = await this.findById(id);
    if (!updated) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
    return updated;
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
    return this.userRepository.save(user);
  }

  async toggleStatus(id: string, isActive: boolean): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
    user.isActive = isActive;
    return this.userRepository.save(user);
  }

  async deleteUser(id: string, currentAdminId: string): Promise<void> {
    if (id === currentAdminId) {
      throw new BadRequestException(
        'Administrators cannot delete their own account.',
      );
    }
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
    await this.userRepository.delete(id);
  }
}
