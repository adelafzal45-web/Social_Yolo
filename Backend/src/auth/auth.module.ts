import { Global, Module, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './jwt.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { RedisService } from './redis/redis.service';
import { ProfilesService } from './profiles/profiles.service';
import { UsersModule } from '../users/users.module';

@Global()
@Module({
  imports: [forwardRef(() => UsersModule)],
  controllers: [AuthController],
  providers: [AuthService, TokenService, JwtAuthGuard, RolesGuard, RedisService, ProfilesService],
  exports: [AuthService, TokenService, JwtAuthGuard, RolesGuard, RedisService, ProfilesService],
})
export class AuthModule {}
