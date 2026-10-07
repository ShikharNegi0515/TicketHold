import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['typeorm', 'pg', 'reflect-metadata'],
  experimental: {
    serverMinification: false,
  },
};

export default nextConfig;
