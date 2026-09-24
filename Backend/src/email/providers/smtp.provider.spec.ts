import { SmtpProvider } from './smtp.provider';
import { SmtpEncryption } from '../entities/email-provider.entity';

describe('SmtpProvider', () => {
  it('should initialize with correct provider name', () => {
    const provider = new SmtpProvider({
      host: 'localhost',
      port: 1025,
      fromEmail: 'noreply@socialyolo.com',
      fromName: 'SocialYolo',
      encryptionType: SmtpEncryption.STARTTLS,
    });
    expect(provider.getProviderName()).toBe('smtp');
  });

  it('should return failure result when verifying an unavailable host', async () => {
    const provider = new SmtpProvider({
      host: '127.0.0.1',
      port: 59999, // Unused port to trigger real connection rejection
      fromEmail: 'noreply@socialyolo.com',
      fromName: 'SocialYolo',
      encryptionType: SmtpEncryption.NONE,
    });

    const result = await provider.verifyConnection();
    expect(result.success).toBe(false);
    expect(result.message).toBeDefined();
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
