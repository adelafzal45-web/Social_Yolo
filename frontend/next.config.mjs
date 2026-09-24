/** @type {import('next').NextConfig} */
const backendPort = process.env.BACKEND_PORT || "3001";
const backendUrl = process.env.BACKEND_URL || `http://127.0.0.1:${backendPort}`;

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
      {
        protocol: "https",
        hostname: "image.pollinations.ai",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/generated-posts/:path*",
        destination: `${backendUrl}/generated-posts/:path*`,
      },
    ];
  },
};

export default nextConfig;
