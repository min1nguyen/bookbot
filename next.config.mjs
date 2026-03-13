/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bundle only books.json + metadata.json; embeddings served from /public/data/
  experimental: {
    outputFileTracingIncludes: {
      "/api/chat": ["./data/books.json", "./data/metadata.json"],
    },
  },
};

export default nextConfig;
