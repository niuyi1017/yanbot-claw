import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  // better-sqlite3 is copied explicitly in the Dockerfile runner stage
  // because Next.js nft cannot follow pnpm virtual-store symlinks.
};

export default nextConfig;
