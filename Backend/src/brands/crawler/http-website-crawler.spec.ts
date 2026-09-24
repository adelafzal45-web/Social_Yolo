import { BadRequestException } from '@nestjs/common';
import { HttpWebsiteCrawler } from './http-website-crawler.service';
import { UrlValidator } from './url-validator';
import { CheerioExtractor } from './cheerio-extractor';

describe('HttpWebsiteCrawler', () => {
  let crawler: HttpWebsiteCrawler;
  let urlValidator: UrlValidator;
  let extractor: CheerioExtractor;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    urlValidator = new UrlValidator();
    extractor = new CheerioExtractor();
    crawler = new HttpWebsiteCrawler(urlValidator, extractor);
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('successfully fetches website and returns a WebsiteSnapshot', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Test Brand</title></head>
        <body>
          <h1>Welcome to Test Brand</h1>
          <p>We build innovative developer tools for enterprise engineering teams.</p>
        </body>
      </html>
    `;

    jest.spyOn(urlValidator, 'assertSafeDnsResolution').mockResolvedValue();

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
      text: jest.fn().mockResolvedValue(mockHtml),
      body: {
        getReader: () => {
          let readCount = 0;
          return {
            read: () => {
              if (readCount === 0) {
                readCount++;
                return Promise.resolve({
                  done: false,
                  value: new TextEncoder().encode(mockHtml),
                });
              }
              return Promise.resolve({ done: true, value: undefined });
            },
            cancel: () => Promise.resolve(),
          };
        },
      },
    } as any);

    const snapshot = await crawler.fetch('https://testbrand.io', { maxInternalPages: 0 });

    expect(snapshot.url).toBe('https://testbrand.io/');
    expect(snapshot.title).toBe('Test Brand');
    expect(snapshot.text).toContain('Welcome to Test Brand');
    expect(snapshot.crawledPages?.length).toBe(1);
  });

  it('rejects automated access blocked (HTTP 403)', async () => {
    jest.spyOn(urlValidator, 'assertSafeDnsResolution').mockResolvedValue();

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      headers: new Headers({ 'content-type': 'text/html' }),
    } as any);

    await expect(crawler.fetch('https://blocked-brand.com')).rejects.toThrow(
      'Website does not allow automated access.',
    );
  });

  it('follows safe redirect up to final destination', async () => {
    jest.spyOn(urlValidator, 'assertSafeDnsResolution').mockResolvedValue();

    let callCount = 0;
    global.fetch = jest.fn().mockImplementation((url: string) => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          status: 301,
          headers: new Headers({ location: 'https://newdomain.com/home' }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: () => Promise.resolve('<html><head><title>New Domain</title></head><body><h1>Redirected</h1></body></html>'),
      });
    });

    const result = await crawler.safeFetchHtml('https://olddomain.com');
    expect(result.finalUrl).toBe('https://newdomain.com/home');
    expect(result.html).toContain('Redirected');
  });

  it('enforces maximum response size limit', async () => {
    jest.spyOn(urlValidator, 'assertSafeDnsResolution').mockResolvedValue();

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'content-type': 'text/html',
        'content-length': '99999999', // Exceeds limit
      }),
    } as any);

    await expect(
      crawler.safeFetchHtml('https://huge-site.com', { maxResponseBytes: 1000 }),
    ).rejects.toThrow('Website response exceeds the maximum allowed size limit.');
  });
});
