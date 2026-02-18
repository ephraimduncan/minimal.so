import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.trycloudflare.com"],
  skipTrailingSlashRedirect: true,
  experimental: {
    optimizePackageImports: ["@tabler/icons-react"],
  },
  cacheComponents: true,
  serverExternalPackages: [
    "@libsql/client",
    "@libsql/core",
    "@libsql/hrana-client",
    "@libsql/isomorphic-fetch",
    "@libsql/isomorphic-ws",
    "libsql",
    "@prisma/adapter-libsql",
    "sharp",
  ],
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/chrome-extension",
        destination:
          "https://chromewebstore.google.com/detail/minimal-save-bookmarks/mldibjljgpjeincabnhhmcgomohffijf",
        permanent: false,
      },
      {
        source: "/chrome",
        destination:
          "https://chromewebstore.google.com/detail/minimal-save-bookmarks/mldibjljgpjeincabnhhmcgomohffijf",
        permanent: false,
      },
      {
        source: "/extension",
        destination:
          "https://chromewebstore.google.com/detail/minimal-save-bookmarks/mldibjljgpjeincabnhhmcgomohffijf",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
