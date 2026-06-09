import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  // Explicitly include better-sqlite3 native binaries in standalone output.
  // Depending on the install environment, better-sqlite3 may use either a
  // prebuilds artifact or a node-gyp build/Release artifact.
  outputFileTracingIncludes: {
    "/api/**": [
      "./node_modules/better-sqlite3/prebuilds/**/*.node",
      "./node_modules/better-sqlite3/build/Release/*.node",
    ],
  },
};

export default nextConfig;
