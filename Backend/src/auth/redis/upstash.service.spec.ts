import { UpstashService } from './upstash.service';

/**
 * With no UPSTASH_* env configured (the default in CI / tests), every method is
 * FAIL-SAFE: cache reads return null so callers fall back to Postgres, writes are
 * no-ops, and the rate limiter fails OPEN (success:true). This guarantees auth is
 * never bricked by Redis being absent or down.
 */
describe('UpstashService (unconfigured)', () => {
  const svc = new UpstashService();

  it('reports itself disabled', () => {
    expect(svc.enabled).toBe(false);
  });

  it('get() returns null (→ caller falls back to source of truth)', async () => {
    await expect(svc.get('profile:u1')).resolves.toBeNull();
  });

  it('set() and del() are silent no-ops', async () => {
    await expect(svc.set('k', { a: 1 }, 60)).resolves.toBeUndefined();
    await expect(svc.del('k')).resolves.toBeUndefined();
  });

  it('limit() fails OPEN (allows) when Upstash is not configured', async () => {
    const res = await svc.limit('auth', '203.0.113.7', 10, '60 s');
    expect(res.success).toBe(true);
    expect(res.remaining).toBe(10);
  });
});
