import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { TokenService } from './jwt.service';
import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;

  const passwordHash = bcrypt.hashSync('Admin@123', 10);
  const mockUser: any = {
    id: 'admin-id',
    email: 'admin@socialyolo.local',
    name: 'Admin User',
    passwordHash,
    role: UserRole.ADMIN,
    credits: 50,
    plan: 'pro',
    isActive: true,
    authProvider: 'local',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    findByEmail: jest.fn().mockImplementation((email: string) => {
      if (email === mockUser.email) return Promise.resolve(mockUser);
      return Promise.resolve(null);
    }),
    findById: jest.fn().mockImplementation((id: string) => {
      if (id === mockUser.id) return Promise.resolve(mockUser);
      return Promise.resolve(null);
    }),
  };

  const mockTokenService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn().mockReturnValue({ sub: 'admin-id', email: 'admin@socialyolo.local', role: 'admin' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: TokenService, useValue: mockTokenService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should authenticate user and return token', async () => {
    const result = await service.login({ email: 'admin@socialyolo.local', password: 'Admin@123' });
    expect(result).toHaveProperty('token', 'mock-jwt-token');
    expect(result.user.email).toBe('admin@socialyolo.local');
    expect(mockTokenService.sign).toHaveBeenCalled();
  });

  it('should reject invalid credentials with UnauthorizedException', async () => {
    await expect(
      service.login({ email: 'admin@socialyolo.local', password: 'WrongPassword' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject nonexistent user with UnauthorizedException', async () => {
    await expect(
      service.login({ email: 'nonexistent@example.com', password: 'Password@123' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
