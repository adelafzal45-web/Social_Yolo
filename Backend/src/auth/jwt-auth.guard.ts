import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Guards routes so only authenticated users (valid Bearer JWT) can call them. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
