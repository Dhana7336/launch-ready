# LaunchReady

Next.js 15 App Router + TypeScript + Tailwind dashboard for tracking fictional product
launch readiness. Built for a take-home assessment — keep it small and readable, not
production-grade.

## Architecture

- `data/products.ts` — static fictional product/checkpoint data. This is the only source
  of truth for the *default* state; never mutate it at runtime.
- `types/product.ts` — `Product` / `Checkpoint` / `RiskLevel` types.
- `lib/evaluate-risk.ts` — pure functions: `calculateReadiness`, `evaluateRisk`,
  `remainingTasks`. Readiness % and risk level are always *derived* from a checkpoint
  list, never stored. If you add a UI element that shows readiness or risk, compute it
  here — don't duplicate the math inline.
- `lib/products.ts` — reads the `launchready_overrides` cookie and merges it over the
  static data (`getProducts` / `getProduct`). This is how a checkpoint toggle persists
  without a database.
- `app/actions.ts` — the one server action (`toggleCheckpoint`). Writes to the same
  cookie, then calls `revalidatePath` on `/` and `/products/[id]`.
- `app/page.tsx` (homepage) and `app/products/[id]/page.tsx` (dynamic route) are both
  Server Components — no `"use client"`, no client-side fetching.
- `components/checkpoint-list.tsx` uses `<form action={toggleCheckpoint.bind(...)}>` per
  row, so the toggle works without shipping a client component.

## Conventions

- No database. State beyond the static data lives only in the `launchready_overrides`
  cookie as a diff (`{ productId: { checkpointId: completed } }`). Don't reach for
  Prisma/Postgres/etc. for this project — that was an explicit assessment constraint.
- Dates are date-only ISO strings (`"2026-09-15"`). Always format them through
  `lib/format-date.ts` (`formatLaunchDate`), which forces UTC — parsing/formatting
  without that produces an off-by-one-day bug in timezones behind UTC.
- Keep Server Components as the default. Only add `"use client"` if something genuinely
  needs browser-only interactivity that a form + server action can't express.
- Risk thresholds and checkpoint weights live in exactly one place each
  (`lib/evaluate-risk.ts` and `data/products.ts` respectively) — don't hardcode a
  checkpoint id or a risk cutoff anywhere else.

## Commands

- `npm run dev` — dev server
- `npm run build` / `npm start` — production build/serve
- `npm run lint` — ESLint (flat config, `next/core-web-vitals` + `next/typescript`)
- `npx tsc --noEmit` — type-check only
