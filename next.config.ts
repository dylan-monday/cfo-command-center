import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude unpdf from bundling - it has its own serverless-optimized pdf.js build
  serverExternalPackages: ['unpdf'],

  // Empty turbopack config to acknowledge we're using Turbopack
  turbopack: {
    resolveAlias: {
      canvas: { browser: './node_modules/canvas' },
    },
  },
};

export default nextConfig;
