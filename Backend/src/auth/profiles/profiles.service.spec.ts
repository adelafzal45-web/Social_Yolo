import { ProfilesService } from './profiles.service';
import type { ProfileRecord } from './profile-role.util';

describe('ProfilesService', () => {
  const profile: ProfileRecord = {
    id: 'u1',
    email: 'a@b.com',
    name: 'A',
    avatar_url: null,
    role: 'USER',
    created_at: '2026-09-16T12:00:00Z',
    updated_at: '2026-09-16T12:00:00Z',
  };

  function make(
    redisMocks: Partial<Record<'get' | 'set' | 'del', jest.Mock>>,
    queryMock: jest.Mock,
  ) {
    const redisMock = {
      get: redisMocks.get ?? jest.fn(),
      set: redisMocks.set ?? jest.fn(),
      del: redisMocks.del ?? jest.fn(),
    };
    const dataSourceMock = { query: queryMock };
    const svc = new ProfilesService(redisMock as any, dataSourceMock as any);
    return { svc, redisMock, dataSourceMock };
  }

  it('returns the cached profile without touching database', async () => {
    const query = jest.fn();
    const { svc } = make({ get: jest.fn().mockResolvedValue(profile) }, query);

    const res = await svc.getProfile('u1');
    expect(res).toEqual(profile);
    expect(query).not.toHaveBeenCalled();
  });

  it('falls back to Postgres on a cache miss and repopulates the cache', async () => {
    const query = jest.fn().mockResolvedValue([
      {
        id: 'u1',
        email: 'a@b.com',
        name: 'A',
        avatar_url: null,
        role: 'USER',
        created_at: '2026-09-16T12:00:00Z',
        updated_at: '2026-09-16T12:00:00Z',
      },
    ]);
    const { svc, redisMock } = make(
      {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(undefined),
      },
      query,
    );

    const res = await svc.getProfile('u1');
    expect(res).toEqual(profile);
    expect(query).toHaveBeenCalled();
    expect(redisMock.set).toHaveBeenCalledWith(
      'user:u1:profile',
      expect.objectContaining({ id: 'u1', role: 'USER' }),
      expect.any(Number),
    );
  });

  it('treats a Redis outage (get→null) exactly like a miss — Postgres still authoritative', async () => {
    const query = jest.fn().mockResolvedValue([
      {
        id: 'u1',
        email: 'a@b.com',
        name: 'A',
        avatar_url: null,
        role: 'USER',
        created_at: '2026-09-16T12:00:00Z',
        updated_at: '2026-09-16T12:00:00Z',
      },
    ]);
    const { svc } = make({ get: jest.fn().mockResolvedValue(null) }, query);

    expect(await svc.getProfile('u1')).toEqual(profile);
    expect(query).toHaveBeenCalled();
  });

  it('returns null and does not cache when the profile does not exist', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const { svc, redisMock } = make(
      { get: jest.fn().mockResolvedValue(null), set: jest.fn() },
      query,
    );

    expect(await svc.getProfile('missing')).toBeNull();
    expect(redisMock.set).not.toHaveBeenCalled();
  });

  it('invalidate() drops the cached key', async () => {
    const { svc, redisMock } = make(
      { del: jest.fn().mockResolvedValue(undefined) },
      jest.fn(),
    );
    await svc.invalidate('u1');
    expect(redisMock.del).toHaveBeenCalledWith('user:u1:profile');
  });
});
