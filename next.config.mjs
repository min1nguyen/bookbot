/** @type {import('next').NextConfig} */
const nextConfig = {
  // Include data files in serverless function bundles (Vercel)
  experimental: {
    outputFileTracingIncludes: {
      "/api/chat": ["./data/**/*"],
    },
  },
};

export default nextConfig;
