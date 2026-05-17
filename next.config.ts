import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist uses node-specific APIs
  serverExternalPackages: ['pdfjs-dist'],
  outputFileTracingIncludes: {
    '/api/analyze': ['samples/**/*'],
  },
  
  experimental: {
    // Increase body size limit for file uploads (10MB)
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
