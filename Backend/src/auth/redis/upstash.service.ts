import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * UpstashService is maintained for backwards compatibility with existing specs/imports,
 * delegating directly to the provider-agnostic RedisService.
 */
@Injectable()
export class UpstashService extends RedisService {}
