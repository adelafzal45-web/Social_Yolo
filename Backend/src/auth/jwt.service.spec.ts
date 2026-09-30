import { TokenService } from './jwt.service';
import { UnauthorizedException } from '@nestjs/common';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    process.env.JWT_SECRET =
      'a_very_secure_test_secret_key_with_at_least_32_characters';
    process.env.JWT_EXPIRES_IN = '1h';
    service = new TokenService();
  });

  it('should sign and verify a valid payload', () => {
    const payload = {
      sub: 'test-user-id',
      email: 'test@example.com',
      role: 'user',
      name: 'Test User',
    };

    const token = service.sign(payload);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    const verified = service.verify(token);
    expect(verified.sub).toBe(payload.sub);
    expect(verified.email).toBe(payload.email);
    expect(verified.role).toBe(payload.role);
    expect(verified.name).toBe(payload.name);
  });

  it('should throw UnauthorizedException for an invalid token', () => {
    expect(() => service.verify('invalid.token.here')).toThrow(
      UnauthorizedException,
    );
  });
});
