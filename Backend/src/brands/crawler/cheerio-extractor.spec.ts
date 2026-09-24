import { CheerioExtractor } from './cheerio-extractor';

describe('CheerioExtractor', () => {
  let extractor: CheerioExtractor;

  beforeEach(() => {
    extractor = new CheerioExtractor();
  });

  const sampleHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Acme Studio | Creative AI Social Design</title>
        <meta name="description" content="Acme Studio builds modern AI-powered creative design engines for teams." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#4f46e5" />
        <meta property="og:title" content="Acme Studio - AI Creative" />
        <meta property="og:description" content="Turn your brand into stunning social content." />
        <meta property="og:image" content="https://acme.com/og-banner.png" />
        <meta property="og:site_name" content="Acme Studio" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://acme.com" />
        <link rel="icon" href="/favicon.png" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700&display=swap" />
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Acme Studio",
            "url": "https://acme.com",
            "logo": "https://acme.com/assets/logo.svg"
          }
        </script>
        <!-- Malformed JSON-LD script that must not crash the parser -->
        <script type="application/ld+json">
          { malformed json ld content here }
        </script>
        <style>
          body { font-family: 'Inter', sans-serif; color: #1e293b; background-color: #f8fafc; }
          .cta-btn { background-color: #ec4899; color: #ffffff; }
        </style>
      </head>
      <body>
        <div class="cookie-banner">This site uses cookies. <button>Accept</button></div>
        <header>
          <a class="brand-logo" href="/"><img src="/logo.svg" alt="Acme Studio Logo" /></a>
          <nav>
            <a href="/about">About Us</a>
            <a href="/services">Our Services</a>
            <a href="/contact">Contact</a>
          </nav>
        </header>
        <main>
          <h1>Next-Generation Creative Automation</h1>
          <h2>Scale your social presence with autonomous AI workflows</h2>
          <p>Acme Studio delivers high-velocity visual post creation tailored to modern brands.</p>
          <h3>Designed for Fast-Growing Teams</h3>
          <p>Generate on-brand visuals, captions, and creative concepts across Instagram and LinkedIn.</p>
          <img src="/hero-showcase.png" alt="Product Showcase" width="1200" height="630" />
        </main>
        <footer>
          <a href="https://instagram.com/acmestudio">Instagram</a>
          <a href="https://linkedin.com/company/acme-studio">LinkedIn</a>
          <a href="https://x.com/acmestudio">X</a>
          <!-- Sharer link to be ignored -->
          <a href="https://twitter.com/intent/tweet?text=Check+this+out">Tweet this</a>
        </footer>
      </body>
    </html>
  `;

  it('extracts complete structured website snapshot', () => {
    const snapshot = extractor.extractSnapshot(sampleHtml, 'https://acme.com');

    expect(snapshot.url).toBe('https://acme.com');
    expect(snapshot.title).toBe('Acme Studio | Creative AI Social Design');
    expect(snapshot.description).toBe(
      'Acme Studio builds modern AI-powered creative design engines for teams.',
    );
    expect(snapshot.language).toBe('en');
    expect(snapshot.canonicalUrl).toBe('https://acme.com');

    // Headings
    expect(snapshot.headings).toContain('Next-Generation Creative Automation');
    expect(snapshot.headings).toContain('Scale your social presence with autonomous AI workflows');
    expect(snapshot.headings).toContain('Designed for Fast-Growing Teams');

    // Text content does not contain cookie banner or navigation
    expect(snapshot.text).toContain('Next-Generation Creative Automation');
    expect(snapshot.text).not.toContain('This site uses cookies');

    // OpenGraph & Twitter
    expect(snapshot.openGraph?.siteName).toBe('Acme Studio');
    expect(snapshot.openGraph?.image).toBe('https://acme.com/og-banner.png');
    expect(snapshot.twitter?.card).toBe('summary_large_image');

    // Logos & Favicon
    expect(snapshot.logo).toBe('https://acme.com/assets/logo.svg');
    expect(snapshot.favicon).toBe('https://acme.com/favicon.png');
    expect(snapshot.availableLogos).toBeDefined();
    expect(snapshot.availableLogos!.length).toBeGreaterThan(0);

    // Social Links
    const platforms = snapshot.socialLinks.map((s) => s.platform);
    expect(platforms).toContain('instagram');
    expect(platforms).toContain('linkedin');
    expect(platforms).toContain('x');
    // Sharer intent link was excluded
    expect(snapshot.socialLinks.some((s) => s.url.includes('intent'))).toBe(false);

    // Colors & Fonts
    expect(snapshot.colors).toContain('#4F46E5'); // theme-color normalized
    expect(snapshot.colors).toContain('#EC4899'); // button color
    expect(snapshot.fonts).toContain('Plus Jakarta Sans');
    expect(snapshot.fonts).toContain('Inter');

    // Resilient JSON-LD
    expect(snapshot.structuredData.length).toBe(1);
    expect((snapshot.structuredData[0] as any).name).toBe('Acme Studio');
  });

  it('discovers key internal links', () => {
    const links = extractor.discoverInternalLinks(sampleHtml, 'https://acme.com');
    const pageTypes = links.map((l) => l.pageType);
    expect(pageTypes).toContain('ABOUT');
    expect(pageTypes).toContain('SERVICE');
    expect(pageTypes).toContain('CONTACT');
  });
});
