import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin requests from local development origins
  allowedDevOrigins: [
    'localhost:3000',
    '127.0.0.1:3000',
    'localhost',
    '127.0.0.1'
  ],
  // Experimental features
  experimental: {
    // Disable Turbopack for now due to path resolution issues
    turbo: false,
  },
  // Ensure proper path resolution
  webpack: (config, { isServer }) => {
    // Add any webpack customizations here if needed
    return config;
  },
};

export default nextConfig;
