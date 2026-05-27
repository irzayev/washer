import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@washer/types', '@washer/utils'],
  experimental: { typedRoutes: false },
};

export default config;
