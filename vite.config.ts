import { defineConfig, searchForWorkspaceRoot } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import os from "node:os";
import path from "node:path";

// Bun symlinks deps into its global cache (~/.bun/install/cache/links/…), which
// lives outside the workspace root. Vite serves static assets (e.g. font woff2)
// via /@fs/ using the resolved real path, so that path must be allow-listed or
// the dev server returns 403. Honor BUN_INSTALL when set.
const bunCache = path.join(
  process.env.BUN_INSTALL ?? path.join(os.homedir(), ".bun"),
  "install/cache",
);

export default defineConfig({
  server: {
    port: 3000,
    fs: { allow: [searchForWorkspaceRoot(process.cwd()), bunCache] },
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
