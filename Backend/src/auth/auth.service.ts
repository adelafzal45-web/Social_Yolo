import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { TokenService } from './jwt.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
  ) {}

  private sanitizeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      credits: user.credits,
      plan: user.plan,
      avatarUrl: user.avatarUrl,
      authProvider: user.authProvider,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async register(dto: RegisterDto): Promise<{ user: any; token: string }> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException(
        'An account with this email address already exists.',
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      role: UserRole.USER,
    });

    const token = this.tokenService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async login(dto: LoginDto): Promise<{ user: any; token: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Your account has been deactivated. Please contact an administrator.',
      );
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'This account was created with Google Sign-In. Please click "Continue with Google" to log in.',
      );
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const token = this.tokenService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    const genericMessage =
      'If an account with that email exists, password reset instructions have been generated.';

    if (!user) {
      return { message: genericMessage };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.usersService.update(user.id, {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: expires,
    });

    const resetUrl = `http://localhost:3000/reset-password?token=${rawToken}`;
    this.logger.log(
      `Password reset token generated for [${user.email}].`,
    );

    return {
      message: genericMessage,
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const hashedToken = crypto
      .createHash('sha256')
      .update(dto.token)
      .digest('hex');

    const user = await this.usersService.findByResetToken(hashedToken);

    if (!user) {
      throw new BadRequestException(
        'Password reset token is invalid or has expired.',
      );
    }

    if (
      !user.resetPasswordExpires ||
      new Date() > new Date(user.resetPasswordExpires)
    ) {
      throw new BadRequestException(
        'Password reset token has expired. Please request a new one.',
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.newPassword, salt);

    await this.usersService.update(user.id, {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    return {
      message: 'Password has been successfully reset. You may now log in.',
    };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        'This account was created with Google Sign-In and does not have a local password.',
      );
    }

    const isMatch = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.newPassword, salt);

    await this.usersService.update(userId, {
      passwordHash,
    });

    return { message: 'Password changed successfully.' };
  }

  async getProfile(userId: string): Promise<{ user: any; token: string }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated.');
    }
    const token = this.tokenService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async refreshToken(userId: string): Promise<{ user: any; token: string }> {
    return this.getProfile(userId);
  }

  /** Initializes and returns the official Google OAuth2 client. */
  private getGoogleOAuthClient(): OAuth2Client {
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    const callbackUrl =
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3001/api/auth/google/callback';

    if (!clientId || !clientSecret) {
      this.logger.warn(
        'GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not configured in .env. Real Google OAuth calls will require these credentials.',
      );
    }

    return new OAuth2Client(clientId, clientSecret, callbackUrl);
  }

  /**
   * Generates the Google OAuth 2.0 authorization URL for server-side redirects.
   * If credentials are not configured, returns null to trigger instant Google sign-in.
   */
  async getGoogleAuthUrl(): Promise<string | null> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return null;
    }

    const client = this.getGoogleOAuthClient();
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'openid',
      ],
    });
  }


  /**
   * Handles the Google OAuth callback authorization code exchange.
   * Supports both server redirect callback URLs and client popup 'postmessage' redirect URI.
   */
  async handleGoogleCallback(
    code: string,
    redirectUri?: string,
  ): Promise<{ user: any; token: string }> {
    if (!code) {
      throw new BadRequestException(
        'Authorization code is missing from Google callback.',
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    const serverCallbackUrl =
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3001/api/auth/google/callback';

    // Prioritize passed redirectUri, otherwise check postmessage and server callback
    const urisToTry = redirectUri
      ? [
          redirectUri,
          'postmessage',
          serverCallbackUrl,
          'http://localhost:3000/auth/callback',
        ]
      : [
          serverCallbackUrl,
          'postmessage',
          'http://localhost:3000/auth/callback',
        ];

    let tokens: any = null;
    let lastError: any = null;

    for (const uri of urisToTry) {
      try {
        const client = new OAuth2Client(clientId, clientSecret, uri);
        const response = await client.getToken({ code, redirect_uri: uri });
        tokens = response.tokens;
        if (tokens) {
          this.logger.log(
            `Google OAuth code exchange succeeded with redirect_uri: [${uri}]`,
          );
          break;
        }
      } catch (err: any) {
        lastError = err;
        this.logger.debug(
          `Token exchange try failed for [${uri}]: ${err.message}`,
        );
      }
    }

    if (!tokens) {
      this.logger.error(
        `Failed to exchange Google OAuth code: ${lastError?.message}`,
      );
      throw new UnauthorizedException(
        `Failed to exchange Google authorization code: ${lastError?.message || 'Invalid code'}`,
      );
    }

    let payload: any = null;
    if (tokens.id_token) {
      try {
        const authClient = this.getGoogleOAuthClient();
        const ticket = await authClient.verifyIdToken({
          idToken: tokens.id_token,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      } catch (e: any) {
        this.logger.warn(`Could not verify id_token signature: ${e.message}`);
      }
    }

    // If id_token verification was skipped or failed, query userinfo endpoint
    if (!payload && tokens.access_token) {
      const userinfoRes = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        },
      );
      if (userinfoRes.ok) {
        payload = await userinfoRes.json();
      }
    }

    if (!payload || !payload.email) {
      throw new UnauthorizedException(
        'Failed to retrieve user profile from Google.',
      );
    }

    const user = await this.findOrCreateGoogleUser({
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.given_name || 'Google User',
      avatarUrl: payload.picture,
    });

    const token = this.tokenService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Verifies a client-side Google ID token (from Google One-Tap or Google Identity Services pop-up).
   */
  async verifyGoogleToken(
    credential: string,
  ): Promise<{ user: any; token: string }> {
    if (!credential) {
      throw new BadRequestException('Google credential/ID token is required.');
    }

    const client = this.getGoogleOAuthClient();
    const clientId = process.env.GOOGLE_CLIENT_ID;

    let payload: any = null;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch (err: any) {
      this.logger.error(`Google ID token verification failed: ${err.message}`);
      throw new UnauthorizedException(
        'Invalid or expired Google credential token.',
      );
    }

    if (!payload || !payload.email) {
      throw new UnauthorizedException(
        'Google ID token does not contain a verified email address.',
      );
    }

    const user = await this.findOrCreateGoogleUser({
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.given_name || 'Google User',
      avatarUrl: payload.picture,
    });

    const token = this.tokenService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Finds existing user by googleId or email, or creates a new Google user.
   */
  private async findOrCreateGoogleUser(data: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }): Promise<User> {
    // 1. Try finding user by googleId
    let user = await this.usersService.findByGoogleId(data.googleId);
    if (user) {
      if (!user.isActive) {
        throw new UnauthorizedException(
          'Your account has been deactivated. Please contact an administrator.',
        );
      }
      // Update avatar or name if not set
      if ((!user.avatarUrl && data.avatarUrl) || (!user.name && data.name)) {
        user = await this.usersService.update(user.id, {
          avatarUrl: user.avatarUrl || data.avatarUrl,
          name: user.name || data.name,
        });
      }
      return user;
    }

    // 2. Try finding user by email
    user = await this.usersService.findByEmail(data.email);
    if (user) {
      if (!user.isActive) {
        throw new UnauthorizedException(
          'Your account has been deactivated. Please contact an administrator.',
        );
      }
      // Link Google ID to existing account
      user = await this.usersService.update(user.id, {
        googleId: data.googleId,
        authProvider:
          user.authProvider === 'local' ? 'local+google' : user.authProvider,
        avatarUrl: user.avatarUrl || data.avatarUrl,
      });
      return user;
    }

    // 3. Create new user with 50 default credits
    user = await this.usersService.create({
      email: data.email,
      name: data.name,
      googleId: data.googleId,
      authProvider: 'google',
      avatarUrl: data.avatarUrl,
      role: UserRole.USER,
    });

    this.logger.log(
      `Created new Google OAuth user account for [${data.email}]`,
    );
    return user;
  }
}
