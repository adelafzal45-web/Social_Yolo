import { BadRequestException } from '@nestjs/common';
import { UrlValidator } from './url-validator';

describe('UrlValidator', () => {
  let validator: UrlValidator;

  beforeEach(() => {
    validator = new UrlValidator();
  });

  describe('normalizeUrl', () => {
    it('normalizes valid HTTPS URL', () => {
      const result = validator.normalizeUrl('https://example.com/about');
      expect(result).toBe('https://example.com/about');
    });

    it('adds https prefix to clean domain', () => {
      const result = validator.normalizeUrl('example.com/pricing');
      expect(result).toBe('https://example.com/pricing');
    });

    it('allows valid HTTP URL', () => {
      const result = validator.normalizeUrl('http://example.com');
      expect(result).toBe('http://example.com/');
    });

    it('rejects unsupported protocols: file:', () => {
      expect(() => validator.normalizeUrl('file:///etc/passwd')).toThrow(BadRequestException);
    });

    it('rejects unsupported protocols: javascript:', () => {
      expect(() => validator.normalizeUrl('javascript:alert(1)')).toThrow(BadRequestException);
    });

    it('rejects unsupported protocols: data:', () => {
      expect(() => validator.normalizeUrl('data:text/html,<h1>Hello</h1>')).toThrow(
        BadRequestException,
      );
    });

    it('rejects empty or whitespace URLs', () => {
      expect(() => validator.normalizeUrl('')).toThrow(BadRequestException);
      expect(() => validator.normalizeUrl('   ')).toThrow(BadRequestException);
    });

    it('rejects invalid hostname without dots', () => {
      expect(() => validator.normalizeUrl('http://invalidhost')).toThrow(BadRequestException);
    });
  });

  describe('assertSafeHostname & SSRF Checks', () => {
    it('blocks localhost', () => {
      expect(() => validator.assertSafeHostname('localhost')).toThrow(BadRequestException);
    });

    it('blocks internal suffixes', () => {
      expect(() => validator.assertSafeHostname('app.internal')).toThrow(BadRequestException);
      expect(() => validator.assertSafeHostname('router.local')).toThrow(BadRequestException);
      expect(() => validator.assertSafeHostname('db.corp')).toThrow(BadRequestException);
      expect(() => validator.assertSafeHostname('server.lan')).toThrow(BadRequestException);
    });

    it('blocks cloud metadata hostnames', () => {
      expect(() => validator.assertSafeHostname('metadata.google.internal')).toThrow(
        BadRequestException,
      );
    });

    it('blocks loopback IP 127.0.0.1', () => {
      expect(() => validator.assertSafeHostname('127.0.0.1')).toThrow(BadRequestException);
    });

    it('blocks 0.0.0.0', () => {
      expect(() => validator.assertSafeHostname('0.0.0.0')).toThrow(BadRequestException);
    });

    it('blocks private IP ranges (10.x, 172.16.x, 192.168.x)', () => {
      expect(() => validator.assertSafeHostname('10.0.0.1')).toThrow(BadRequestException);
      expect(() => validator.assertSafeHostname('172.16.0.1')).toThrow(BadRequestException);
      expect(() => validator.assertSafeHostname('192.168.1.1')).toThrow(BadRequestException);
    });

    it('blocks cloud metadata IP 169.254.169.254', () => {
      expect(() => validator.assertSafeHostname('169.254.169.254')).toThrow(BadRequestException);
    });

    it('blocks IPv6 loopback and private', () => {
      expect(validator.isPrivateOrRestrictedIp('::1')).toBe(true);
      expect(validator.isPrivateOrRestrictedIp('fc00::1')).toBe(true);
      expect(validator.isPrivateOrRestrictedIp('fe80::1')).toBe(true);
    });

    it('allows public domain names and public IPs', () => {
      expect(() => validator.assertSafeHostname('google.com')).not.toThrow();
      expect(() => validator.assertSafeHostname('github.com')).not.toThrow();
      expect(validator.isPrivateOrRestrictedIp('8.8.8.8')).toBe(false);
      expect(validator.isPrivateOrRestrictedIp('1.1.1.1')).toBe(false);
    });
  });
});
