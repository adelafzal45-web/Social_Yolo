import { Injectable, Logger } from '@nestjs/common';
import * as dns from 'dns/promises';

export interface DnsRecordStatus {
  type: 'SPF' | 'DKIM' | 'DMARC' | 'MX';
  name: string;
  expected: string;
  found?: string;
  status: 'VERIFIED' | 'PENDING' | 'FAILED';
  description: string;
}

export interface DomainVerificationResult {
  domain: string;
  isVerified: boolean;
  status: 'VERIFIED' | 'PENDING' | 'FAILED';
  checkedAt: Date;
  records: DnsRecordStatus[];
}

@Injectable()
export class EmailDnsService {
  private readonly logger = new Logger(EmailDnsService.name);

  /**
   * Performs genuine DNS resolution to check SPF, DKIM, and DMARC records.
   */
  async verifyDomain(
    domain: string,
    dkimSelector = 'socialyolo',
  ): Promise<DomainVerificationResult> {
    const cleanDomain = domain.toLowerCase().trim();
    const records: DnsRecordStatus[] = [];

    // 1. Check SPF (TXT record on domain)
    const spfRecord = await this.checkSpf(cleanDomain);
    records.push(spfRecord);

    // 2. Check DMARC (TXT record on _dmarc.domain)
    const dmarcRecord = await this.checkDmarc(cleanDomain);
    records.push(dmarcRecord);

    // 3. Check DKIM (TXT record on selector._domainkey.domain)
    const dkimRecord = await this.checkDkim(cleanDomain, dkimSelector);
    records.push(dkimRecord);

    // 4. Check MX records
    const mxRecord = await this.checkMx(cleanDomain);
    records.push(mxRecord);

    const isVerified = records.every(
      (r) => r.status === 'VERIFIED' || (r.type === 'MX' && r.status !== 'FAILED'),
    );

    const anyFailed = records.some((r) => r.status === 'FAILED');

    return {
      domain: cleanDomain,
      isVerified,
      status: isVerified ? 'VERIFIED' : anyFailed ? 'FAILED' : 'PENDING',
      checkedAt: new Date(),
      records,
    };
  }

  private async checkSpf(domain: string): Promise<DnsRecordStatus> {
    try {
      const txtRecords = await dns.resolveTxt(domain);
      const flattened = txtRecords.map((chunks) => chunks.join(''));
      const spf = flattened.find((r) => r.toLowerCase().startsWith('v=spf1'));

      if (spf) {
        return {
          type: 'SPF',
          name: domain,
          expected: 'v=spf1 include:... ~all',
          found: spf,
          status: 'VERIFIED',
          description: 'Sender Policy Framework (SPF) record found and validated.',
        };
      }

      return {
        type: 'SPF',
        name: domain,
        expected: 'v=spf1 include:... ~all',
        status: 'PENDING',
        description: 'No TXT record starting with v=spf1 found on root domain.',
      };
    } catch (err: any) {
      return {
        type: 'SPF',
        name: domain,
        expected: 'v=spf1 include:... ~all',
        status: 'FAILED',
        description: `DNS query failed: ${err.message}`,
      };
    }
  }

  private async checkDmarc(domain: string): Promise<DnsRecordStatus> {
    const dmarcDomain = `_dmarc.${domain}`;
    try {
      const txtRecords = await dns.resolveTxt(dmarcDomain);
      const flattened = txtRecords.map((chunks) => chunks.join(''));
      const dmarc = flattened.find((r) => r.toLowerCase().startsWith('v=dmarc1'));

      if (dmarc) {
        return {
          type: 'DMARC',
          name: dmarcDomain,
          expected: 'v=DMARC1; p=none; ...',
          found: dmarc,
          status: 'VERIFIED',
          description: 'DMARC policy record found and validated.',
        };
      }

      return {
        type: 'DMARC',
        name: dmarcDomain,
        expected: 'v=DMARC1; p=none; ...',
        status: 'PENDING',
        description: 'No DMARC record found at _dmarc host.',
      };
    } catch (err: any) {
      return {
        type: 'DMARC',
        name: dmarcDomain,
        expected: 'v=DMARC1; p=none; ...',
        status: 'FAILED',
        description: `DNS query failed: ${err.message}`,
      };
    }
  }

  private async checkDkim(domain: string, selector: string): Promise<DnsRecordStatus> {
    const dkimHost = `${selector}._domainkey.${domain}`;
    try {
      const txtRecords = await dns.resolveTxt(dkimHost);
      const flattened = txtRecords.map((chunks) => chunks.join(''));
      const dkim = flattened.find((r) => r.toLowerCase().includes('v=dkim1') || r.includes('p='));

      if (dkim) {
        return {
          type: 'DKIM',
          name: dkimHost,
          expected: 'k=rsa; p=...',
          found: dkim.length > 50 ? `${dkim.substring(0, 47)}...` : dkim,
          status: 'VERIFIED',
          description: 'DKIM public key TXT record found.',
        };
      }

      return {
        type: 'DKIM',
        name: dkimHost,
        expected: 'k=rsa; p=...',
        status: 'PENDING',
        description: `No DKIM record found at selector ${selector}.`,
      };
    } catch (err: any) {
      return {
        type: 'DKIM',
        name: dkimHost,
        expected: 'k=rsa; p=...',
        status: 'PENDING',
        description: `DKIM lookup at ${dkimHost} returned no record.`,
      };
    }
  }

  private async checkMx(domain: string): Promise<DnsRecordStatus> {
    try {
      const mxRecords = await dns.resolveMx(domain);
      if (mxRecords && mxRecords.length > 0) {
        const topMx = mxRecords.sort((a, b) => a.priority - b.priority)[0];
        return {
          type: 'MX',
          name: domain,
          expected: 'Mail exchanger record',
          found: `${topMx.exchange} (priority ${topMx.priority})`,
          status: 'VERIFIED',
          description: `Found ${mxRecords.length} active MX mail routing records.`,
        };
      }
      return {
        type: 'MX',
        name: domain,
        expected: 'Mail exchanger record',
        status: 'PENDING',
        description: 'No MX records configured for receiving mail.',
      };
    } catch (err: any) {
      return {
        type: 'MX',
        name: domain,
        expected: 'Mail exchanger record',
        status: 'PENDING',
        description: `MX resolution pending: ${err.message}`,
      };
    }
  }
}
