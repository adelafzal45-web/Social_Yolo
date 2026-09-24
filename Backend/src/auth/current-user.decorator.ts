import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { User } from './entities/user.entity';

/**
 * Injects the authenticated `User` (attached by JwtStrategy) into a handler:
 * `@CurrentUser() user: User`
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<{ user: User }>();
    return request.user;
  },
);
