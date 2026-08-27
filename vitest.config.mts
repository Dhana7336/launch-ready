import path from "path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  // Next's tsconfig.json sets "jsx": "preserve" for its own bundler (webpack/Turbopack),
  // but Vite's default transform (oxc, as of Vite 7) needs a JSX mode it can actually
  // compile — without this, importing any .tsx file (even just to test a non-JSX named
  // export like generateMetadata) fails to parse. `oxc: false` falls back to esbuild,
  // whose `jsx` option this then sets directly (oxc ignores esbuild's jsx option, and vice
  // versa — only one transform is active at a time). Doesn't touch tsconfig.json, which
  // Next needs unchanged.
  oxc: false,
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": import.meta.dirname,
      // Outside Next's own bundler, "server-only" has no "react-server" condition to pick
      // its no-op export and falls back to the variant that always throws (see
      // node_modules/server-only/package.json). Point it at that same no-op file directly
      // rather than changing resolve.conditions globally, which would also affect how
      // every other conditionally-exported package (e.g. next/headers) resolves here.
      "server-only": path.resolve(import.meta.dirname, "node_modules/server-only/empty.js"),
    },
  },
  test: {
    environment: "node",
    // e2e/*.spec.ts are Playwright tests (npm run test:e2e) — Vitest's default include
    // glob also matches "*.spec.ts", so exclude that directory explicitly or it tries to
    // collect them itself and fails on the @playwright/test imports.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
