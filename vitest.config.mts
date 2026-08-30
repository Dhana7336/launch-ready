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
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Deliberately no `all: true` / manual `include` list: coverage reports only the
      // files this suite actually imports (lib/, data/, and the couple of app/ files with
      // unit tests) — the real domain/persistence/metadata layer. Components and pages are
      // exercised by the separate Playwright suite (e2e/), which v8/Vitest can't see inside
      // a real browser — folding them in here as 0% would understate real coverage, not
      // reveal a gap.
      //
      // components/** is excluded outright: none of them have an actual unit test. A few
      // (checkpoint-list.tsx, checkpoint-toggle-form.tsx, product-spec-grid.tsx,
      // risk-badge.tsx) still show up in v8's raw output purely because
      // app/products/[id]/page.tsx imports them and page.test.ts imports that module for
      // generateMetadata — the component code itself never runs. That's a module-graph
      // artifact, not a real coverage signal, so it's excluded rather than left to read as
      // "these are undertested."
      exclude: [
        ...(configDefaults.coverage?.exclude ?? []),
        "e2e/**",
        "**/*.config.*",
        "components/**",
      ],
    },
  },
});
