import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@arcgis/core'],
  experimental: {
    // Required for ArcGIS CSS assets
    optimizePackageImports: ['@arcgis/core'],
  },
  // Empty turbopack config silences the webpack-vs-turbopack conflict warning in Next.js 16
  turbopack: {},
  webpack: (config) => {
    // ArcGIS Core uses workers — exclude from server bundle
    config.externals = config.externals || [];
    if (Array.isArray(config.externals)) {
      config.externals.push({ '@arcgis/core': 'commonjs @arcgis/core' });
    }
    return config;
  },
};

export default nextConfig;
