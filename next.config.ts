import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  experimental: {
    // Explicitly include better-sqlite3 native binary in standalone output.
    // Next.js nft does not auto-trace .node files, so without this the
    // binary is missing at runtime and all db-backed routes return 500.
    outputFileTracingIncludes: {
      "/api/**": ["./node_modules/better-sqlite3/build/Release/*.node"],
    },
  },
};

export default nextConfig;
