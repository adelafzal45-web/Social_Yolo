import { EmailCryptoService } from './email-crypto.service';

describe('EmailCryptoService', () => {
  let service: EmailCryptoService;

  beforeEach(() => {
    service = new EmailCryptoService();
  });

  it('should encrypt and decrypt plaintext accurately', () => {
    const secret = 'mySuperSecretPassword123!#$';
    const encrypted = service.encrypt(secret);
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toEqual(secret);

    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toEqual(secret);
  });

  it('should return masked string with first and last characters and stars in between', () => {
    const masked = service.mask('supersecretpassword');
    expect(masked.startsWith('su')).toBeTruthy();
    expect(masked.endsWith('rd')).toBeTruthy();
    expect(masked.includes('********')).toBeTruthy();
  });

  it('should handle empty or null values gracefully', () => {
    expect(service.encrypt('')).toBe('');
    expect(service.decrypt('')).toBe('');
    expect(service.mask('')).toBe('');
  });
});
