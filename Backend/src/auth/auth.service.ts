import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

const BCRYPT_ROUNDS = 12;
const JWT_EXPIRES_IN = '7d';

/**
 * Signup / login with bcrypt-hashed passwords and JWT access tokens.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<{ user: User; accessToken: string }> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      // Generic message — do not reveal which emails exist.
      throw new UnauthorizedException('Invalid email or password.');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
    });
    return { user, accessToken: this.signToken(user) };
  }

  async login(dto: LoginDto): Promise<{ user: User; accessToken: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    return { user, accessToken: this.signToken(user) };
  }

  private signToken(user: User): string {
    return this.jwtService.sign({ sub: user.id, email: user.email });
  }
}

export { JWT_EXPIRES_IN };
