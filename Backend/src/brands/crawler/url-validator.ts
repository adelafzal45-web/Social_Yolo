import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as dns from 'dns';
import * as net from 'net';

/**
 * Production SSRF Protector and URL Validator.
 * Prevents requests to localhost, loopback, private RFC1918 ranges,
 * cloud metadata endpoints, internal DNS names, and unsupported schemes.
 */
@Injectable()
export class UrlValidator {
  private readonly logger = new Logger(UrlValidator.name);

  private readonly blockedHostnames = new Set([
    'localhost',
    'loopback',
    'metadata.google.internal',
    'instance-data',
    'metadata',
  ]);

  private readonly blockedSuffixes = [
    '.local',
    '.internal',
    '.localhost',
    '.lan',
    '.corp',
    '.test',
    '.example',
    '.invalid',
    '.home.arpa',
  ];

  /**
   * Validates and normalizes raw user-provided website URL.
   * Ensures http or https protocol and canonical origin.
   */
  normalizeUrl(rawUrl: string): string {
    if (!rawUrl || typeof rawUrl !== 'string') {
      throw new BadRequestException('A valid website URL is required.');
    }

    let trimmed = rawUrl.trim();

    // Check for obvious unsupported or dangerous protocols
    if (/^(javascript|data|file|ftp|blob|vbscript):/i.test(trimmed)) {
      throw new BadRequestException('Unsupported URL protocol. Only HTTP and HTTPS are allowed.');
    }

    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    }

    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      throw new BadRequestException('Invalid URL format.');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new BadRequestException('Invalid website URL. Only HTTP and HTTPS are supported.');
    }

    // Hostname check
    const hostname = parsed.hostname.toLowerCase();
    if (!hostname || !hostname.includes('.')) {
      if (hostname !== 'localhost') {
        throw new BadRequestException('Invalid website hostname.');
      }
    }

    this.assertSafeHostname(hostname);

    // Return origin + pathname (preserving valid query parameters if present, stripping credentials)
    parsed.username = '';
    parsed.password = '';
    return parsed.toString();
  }

  /**
   * Asserts that a hostname is syntactically safe and not pointing to known internal domains.
   */
  assertSafeHostname(hostname: string): void {
    const lower = hostname.toLowerCase().trim();

    if (!lower) {
      throw new BadRequestException('Invalid website URL.');
    }

    if (this.blockedHostnames.has(lower)) {
      throw new BadRequestException('Access to internal or private network addresses is forbidden.');
    }

    for (const suffix of this.blockedSuffixes) {
      if (lower.endsWith(suffix)) {
        throw new BadRequestException('Access to internal or private network addresses is forbidden.');
      }
    }

    // If hostname is directly an IP literal
    if (net.isIP(lower)) {
      if (this.isPrivateOrRestrictedIp(lower)) {
        throw new BadRequestException('Access to internal or private network addresses is forbidden.');
      }
    }
  }

  /**
   * Resolves DNS asynchronously and asserts that none of the destination IPs
   * point to private, loopback, or cloud-metadata networks (SSRF & DNS rebinding protection).
   */
  async assertSafeDnsResolution(url: string): Promise<void> {
    let hostname: string;
    try {
      hostname = new URL(url).hostname;
    } catch {
      throw new BadRequestException('Invalid website URL.');
    }

    this.assertSafeHostname(hostname);

    // If hostname is already an IP, it was checked by assertSafeHostname
    if (net.isIP(hostname)) {
      return;
    }

    try {
      const records = await dns.promises.lookup(hostname, { all: true });
      if (!records || records.length === 0) {
        throw new BadRequestException('Unable to resolve website domain address.');
      }

      for (const record of records) {
        if (this.isPrivateOrRestrictedIp(record.address)) {
          this.logger.warn(`SSRF Blocked: ${hostname} resolved to restricted IP: ${record.address}`);
          throw new BadRequestException(
            'Access to internal or private network addresses is forbidden.',
          );
        }
      }
    } catch (err: any) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      this.logger.debug(`DNS resolution error for ${hostname}: ${err.message}`);
      throw new BadRequestException('Unable to access website domain address.');
    }
  }

  /**
   * Checks if an IPv4 or IPv6 address is in a private, loopback, link-local,
   * multicast, or cloud-metadata range.
   */
  isPrivateOrRestrictedIp(ip: string): boolean {
    const cleanIp = ip.trim().toLowerCase();

    // Check IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1)
    if (cleanIp.startsWith('::ffff:')) {
      const v4Part = cleanIp.slice(7);
      if (net.isIPv4(v4Part)) {
        return this.isPrivateOrRestrictedIpv4(v4Part);
      }
    }

    if (net.isIPv4(cleanIp)) {
      return this.isPrivateOrRestrictedIpv4(cleanIp);
    }

    if (net.isIPv6(cleanIp)) {
      return this.isPrivateOrRestrictedIpv6(cleanIp);
    }

    return true; // Unknown IP format is blocked
  }

  private isPrivateOrRestrictedIpv4(ip: string): boolean {
    const parts = ip.split('.').map((p) => parseInt(p, 10));
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
      return true;
    }

    const [a, b, c] = parts;

    // 0.0.0.0/8 (Current network)
    if (a === 0) return true;

    // 10.0.0.0/8 (RFC1918 Private)
    if (a === 10) return true;

    // 100.64.0.0/10 (Carrier grade NAT)
    if (a === 100 && b >= 64 && b <= 127) return true;

    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;

    // 169.254.0.0/16 (Link-local, AWS/GCP/Azure Cloud Metadata)
    if (a === 169 && b === 254) return true;

    // 172.16.0.0/12 (RFC1918 Private)
    if (a === 172 && b >= 16 && b <= 31) return true;

    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (a === 192 && b === 0 && c === 0) return true;

    // 192.0.2.0/24 (TEST-NET-1)
    if (a === 192 && b === 0 && c === 2) return true;

    // 192.168.0.0/16 (RFC1918 Private)
    if (a === 192 && b === 168) return true;

    // 198.18.0.0/15 (Benchmarking)
    if (a === 198 && (b === 18 || b === 19)) return true;

    // 198.51.100.0/24 (TEST-NET-2)
    if (a === 198 && b === 51 && c === 100) return true;

    // 203.0.113.0/24 (TEST-NET-3)
    if (a === 203 && b === 0 && c === 113) return true;

    // 224.0.0.0/4 (Multicast)
    if (a >= 224 && a <= 239) return true;

    // 240.0.0.0/4 (Reserved / Future Use)
    if (a >= 240) return true;

    return false;
  }

  private isPrivateOrRestrictedIpv6(ip: string): boolean {
    const normalized = ip.toLowerCase();

    // ::1 (Loopback)
    if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;

    // :: (Unspecified)
    if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true;

    // Unique Local Addresses fc00::/7 (fc00... or fd00...)
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;

    // Link-local Unicast fe80::/10 (fe8, fe9, fea, feb)
    if (/^fe[89ab]/i.test(normalized)) return true;

    // Deprecated Site-local fec0::/10
    if (/^fec[0-9a-f]/i.test(normalized)) return true;

    // Multicast ff00::/8
    if (normalized.startsWith('ff')) return true;

    // Documentation 2001:db8::/32
    if (normalized.startsWith('2001:db8:') || normalized.startsWith('2001:0db8:')) return true;

    return false;
  }
}
