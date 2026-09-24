import { HttpException } from '@nestjs/common';
import { RateLimitGuard } from './rate-limit.guard';

/**
 * The guard throttles by client IP using UpstashService.limit(). It allows when
 * under the limit and returns 429 when over. Because UpstashService itself fails
 * OPEN (returns success:true) when Redis is unconfigured/unreachable, the guard
 * never bricks authentication — modelled by the "fail-open" case below.
 */
function ctx(headers: Record<string, string> = {}, ip = '203.0.113.7') {
  const req: any = { headers, ip, socket: { remoteAddress: ip } };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as any;
}

describe('RateLimitGuard', () => {
  it('allows the request when under the limit', async () => {
    const upstash = {
      limit: jest.fn().mockResolvedValue({ success: true, remaining: 9 }),
    };
    const guard = new RateLimitGuard(upstash as any);
    await expect(guard.canActivate(ctx())).resolves.toBe(true);
    expect(upstash.limit).toHaveBeenCalledWith(
      'auth',
      '203.0.113.7',
      expect.any(Number),
      expect.anything(),
    );
  });

  it('throws 429 when over the limit', async () => {
    const upstash = {
      limit: jest.fn().mockResolvedValue({ success: false, remaining: 0 }),
    };
    const guard = new RateLimitGuard(upstash as any);
    await expect(guard.canActivate(ctx())).rejects.toBeInstanceOf(
      HttpException,
    );
    await expect(guard.canActivate(ctx())).rejects.toMatchObject({
      status: 429,
    });
  });

  it('fails open (allows) when the limiter reports success — Upstash unavailable', async () => {
    // UpstashService.limit resolves { success: true } on error / when unconfigured.
    const upstash = {
      limit: jest.fn().mockResolvedValue({ success: true, remaining: 10 }),
    };
    const guard = new RateLimitGuard(upstash as any);
    await expect(guard.canActivate(ctx())).resolves.toBe(true);
  });

  it('prefers the first x-forwarded-for hop as the identifier', async () => {
    const upstash = {
      limit: jest.fn().mockResolvedValue({ success: true, remaining: 9 }),
    };
    const guard = new RateLimitGuard(upstash as any);
    await guard.canActivate(
      ctx({ 'x-forwarded-for': '198.51.100.5, 10.0.0.1' }),
    );
    expect(upstash.limit).toHaveBeenCalledWith(
      'auth',
      '198.51.100.5',
      expect.any(Number),
      expect.anything(),
    );
  });
});
