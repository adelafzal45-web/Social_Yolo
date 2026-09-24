import { EmailUnsubscribeService } from './email-unsubscribe.service';

describe('EmailUnsubscribeService', () => {
  let service: EmailUnsubscribeService;

  beforeEach(() => {
    service = new EmailUnsubscribeService();
  });

  it('should generate a valid signed token and verify it successfully', () => {
    const email = 'creator@socialyolo.local';
    const userId = '005f7c07-134e-44a6-9ba5-39984368255e';
    const token = service.generateToken(email, userId);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.includes('.')).toBeTruthy();

    const verification = service.verifyToken(token);
    expect(verification.valid).toBe(true);
    expect(verification.email).toBe(email);
    expect(verification.userId).toBe(userId);
  });

  it('should reject tampered or corrupt tokens', () => {
    const token = service.generateToken('test@example.com');
    const tampered = token + 'tampered';
    const result = service.verifyToken(tampered);
    expect(result.valid).toBe(false);
  });

  it('should construct valid public unsubscribe URL', () => {
    const url = service.getUnsubscribeUrl('user@example.com');
    expect(url).toContain('/email/unsubscribe?token=');
  });
});
