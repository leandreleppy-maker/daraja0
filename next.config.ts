import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel gère le build automatiquement — pas besoin de "standalone"
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
