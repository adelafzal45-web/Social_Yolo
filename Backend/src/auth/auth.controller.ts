import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard, Public } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setAuthCookie(res: Response, token: string) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({
    status: 400,
    description: 'Email already in use or validation failure.',
  })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    if (result.token) {
      this.setAuthCookie(res, result.token);
    }
    return result;
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated. Returns JWT token.',
  })
  @ApiResponse({ status: 401, description: 'Invalid email or password.' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    if (result.token) {
      this.setAuthCookie(res, result.token);
    }
    return result;
  }

  @Get('google')
  @Public()
  @ApiOperation({ summary: 'Redirect to Google OAuth 2.0 consent screen' })
  async googleAuthRedirect(@Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    try {
      const url = await this.authService.getGoogleAuthUrl();
      if (!url) {
        return res.redirect(
          `${frontendUrl}/auth/callback?error=${encodeURIComponent(
            'Google OAuth is not configured on this server. Please contact an administrator.',
          )}`,
        );
      }
      return res.redirect(url);
    } catch (err: any) {
      return res.redirect(
        `${frontendUrl}/auth/callback?error=${encodeURIComponent(
          err.message || 'Google OAuth initialization failed.',
        )}`,
      );
    }
  }

  @Get('google/callback')
  @Public()
  @ApiOperation({ summary: 'Handle Google OAuth 2.0 authorization callback' })
  async googleAuthCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (error) {
      return res.redirect(
        `${frontendUrl}/auth/callback?error=${encodeURIComponent(error)}`,
      );
    }

    try {
      const result = await this.authService.handleGoogleCallback(code);
      if (result.token) {
        this.setAuthCookie(res, result.token);
      }
      return res.redirect(`${frontendUrl}/auth/callback?token=${result.token}`);
    } catch (err: any) {
      return res.redirect(
        `${frontendUrl}/auth/callback?error=${encodeURIComponent(
          err.message || 'Google authentication failed.',
        )}`,
      );
    }
  }

  @Post('google')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate with client-side Google credential or code',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated. Returns JWT token.',
  })
  @ApiResponse({ status: 401, description: 'Invalid Google credential.' })
  async googleTokenAuth(
    @Body() body: { credential?: string; code?: string; redirectUri?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    let result;
    if (body.credential) {
      result = await this.authService.verifyGoogleToken(body.credential);
    } else if (body.code) {
      result = await this.authService.handleGoogleCallback(
        body.code,
        body.redirectUri || 'postmessage',
      );
    } else {
      throw new BadRequestException(
        'Google credential ID token or authorization code is required.',
      );
    }

    if (result.token) {
      this.setAuthCookie(res, result.token);
    }
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out current session' })
  @ApiResponse({ status: 200, description: 'Successfully logged out.' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('social_yolo_jwt_token', { path: '/' });
    return { message: 'Logged out successfully.' };
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset token/link' })
  @ApiResponse({
    status: 200,
    description: 'Password reset instructions generated.',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token.' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('change-password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password for currently authenticated user' })
  @ApiResponse({ status: 200, description: 'Password changed successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Incorrect current password or invalid new password.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get profile of currently logged-in user' })
  @ApiResponse({ status: 200, description: 'Authenticated user profile.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getProfile(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.getProfile(userId);
    if (result.token) {
      this.setAuthCookie(res, result.token);
    }
    return result;
  }

  @Post('refresh')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh user session token and cookie' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async refresh(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.refreshToken(userId);
    if (result.token) {
      this.setAuthCookie(res, result.token);
    }
    return result;
  }
}
