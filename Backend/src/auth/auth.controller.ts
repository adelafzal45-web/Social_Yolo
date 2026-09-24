import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from './jwt-auth.guard';

/** Public-safe user shape (never exposes the password hash). */
function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    plan: user.plan,
    creditsUsed: user.creditsUsed,
    subscriptionStatus: user.subscriptionStatus,
    currentPeriodEnd: user.currentPeriodEnd,
    createdAt: user.createdAt,
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an account (returns a JWT access token).' })
  async signup(@Body() dto: SignupDto) {
    const { user, accessToken } = await this.authService.signup(dto);
    return { user: toPublicUser(user), accessToken };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log in with email + password (returns a JWT access token).',
  })
  async login(@Body() dto: LoginDto) {
    const { user, accessToken } = await this.authService.login(dto);
    return { user: toPublicUser(user), accessToken };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current authenticated user profile.' })
  me(@CurrentUser() user: User) {
    return { user: toPublicUser(user) };
  }
}

export { toPublicUser };
