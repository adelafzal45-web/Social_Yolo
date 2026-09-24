import { NextResponse } from 'next/server';

/**
 * Dynamic Brand Configuration endpoint.
 * Provides a production-compatible sample response for testing and custom brand serving.
 */
export async function GET() {
  const brandConfig = {
    name: 'SocialYolo',
    shortName: 'SocialYolo',
    description: 'AI-Powered Creative Studio & Social Media Platform',
    logo: '',
    logoLight: '',
    logoDark: '',
    favicon: '/favicon.ico',
    sidebarLogo: '',
    sidebarIcon: '',
    primaryColor: '#6366f1',
    secondaryColor: '#a855f7',
    websiteUrl: 'https://socialyolo.ai',
    supportUrl: 'https://socialyolo.ai/support',
  };

  return NextResponse.json(brandConfig, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
