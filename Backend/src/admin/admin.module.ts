import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

/**
 * Admin RBAC surface. ProfilesService, RedisService and the auth guards
 * are provided by the @Global() AuthModule, so they are injectable here without
 * re-importing.
 */
@Module({
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
