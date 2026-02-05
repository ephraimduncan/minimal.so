import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.trycloudflare.com"],
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
  ],
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
