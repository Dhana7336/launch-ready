# LaunchReady

LaunchReady is a launch-readiness dashboard for a fictional home-goods catalog: it tracks
which operational checkpoints (pricing, inventory, compliance, etc.) a product still needs
before it ships, and turns that checklist into a readiness percentage and a risk level.
Built with Next.js 15 (App Router), TypeScript, and Tailwind CSS as a take-home assessment.

## Product / Business Problem

Every product moves toward launch through six fixed checkpoints:

| Checkpoint | Weight | Critical? |
|---|---|---|
| Product information | 15% | No |
| Pricing approved | 15% | No |
| Product images | 15% | No |
| Inventory confirmed | 25% | Yes |
| Shipping configured | 15% | No |
| Compliance approved | 15% | Yes |

**Readiness** is how much of the checklist is done — the sum of the weights of completed
checkpoints. **Risk** is a separate judgment: how dangerous it would be to launch right
now. The two usually move together, but not always — a product can have decent readiness
and still be high risk, because two of the checkpoints (inventory, compliance) are
*critical*: if either is incomplete, risk is forced to HIGH no matter what the readiness
number says.

Worked example from the real weight table: a product with everything done except
"Inventory confirmed" has readiness = 100 − 25 = **75%**. On readiness alone that would
land in the MEDIUM band (60–84%). But inventory is critical, so risk is **HIGH** — the
dashboard is deliberately unwilling to call an unconfirmed-inventory launch anything less
than high risk, regardless of how complete everything else is.

## Core Business Rules

```text
checkpoints (data/products.ts, per-product completed/incomplete)
        ↓
readiness = sum of completed checkpoints' weights      (lib/evaluate-risk.ts)
        ↓
risk = HIGH if any critical checkpoint is incomplete;
       otherwise LOW at ≥85%, MEDIUM at 60–84%, HIGH below 60%
```

This is the exact order `evaluateRisk` checks in `lib/evaluate-risk.ts`: the critical-
checkpoint override is evaluated first and short-circuits everything else. Readiness and
risk are never stored — `Product` has no `readiness`/`risk` field. Both are recomputed from
the checkpoint list on every render, so there's exactly one source of truth and no way for
a displayed number to drift from the data that produced it.

## Architecture

```text
static product data (data/products.ts)
        +
cookie checkpoint overrides (lib/products.ts)
        ↓
effective product state
        ↓
readiness / risk evaluation (lib/evaluate-risk.ts)
        ↓
Server Components render it (app/page.tsx, app/products/[id]/page.tsx)
        ↓
Server Action mutates a checkpoint (app/actions.ts)
        ↓
revalidatePath("/"), revalidatePath("/products/[id]")
        ↺ next request re-reads the cookie, state loop closes
```

Four concerns stay in four different places: domain logic (`lib/evaluate-risk.ts`, pure
functions, no I/O), persistence/data access (`lib/products.ts`, `app/actions.ts`, both
cookie-aware), rendering (`app/page.tsx`, `app/products/[id]/page.tsx`, and the
`components/` tree, almost all of it server-rendered), and URL/navigation state (the
`?category` query param, resolved server-side in `app/page.tsx`).

## Next.js Design

### Server Components

The homepage and the product detail page are both Server Components — they read the
checkpoint cookie and compute readiness/risk on the server, with no client-side fetching.
Nearly everything under `components/` is server-rendered too (`hero-section.tsx`,
`stats-strip.tsx`, `featured-spotlight.tsx`, `lineup-grid.tsx`, `product-card.tsx`,
`product-spec-grid.tsx`, `risk-badge.tsx`, `checkpoint-list.tsx`, `closing-section.tsx`).
Only four files in the whole repo need a client boundary — see below.

### Client Components

The actual `"use client"` files, and why each one needs it:

- **`components/sidebar.tsx`** — owns open/close state for the mobile off-canvas nav
  drawer (`useState`), plus an effect that closes it on Escape and locks body scroll while
  it's open.
- **`components/category-select.tsx`** — turns a `<select>` change into a URL change via
  `useRouter`/`useSearchParams` (`next/navigation`).
- **`components/checkpoint-toggle-form.tsx`** — uses `useActionState` to read the server
  action's typed return value back into the UI, which requires owning the `<form>` element.
- **`app/error.tsx`** — Next.js requires route error boundaries to be Client Components
  (they receive a `reset()` callback and run after a render failure).

### Server Action

`toggleCheckpoint` (`app/actions.ts`) is the one Server Action. A form bound to it flips a
single checkpoint's `completed` state, persists the change as a cookie diff, then calls
`revalidatePath` on both `/` and `/products/[id]` so readiness/risk recompute everywhere
they're shown.

Failures split into two kinds on purpose. A bad `productId`/`checkpointId` — only reachable
via a tampered request, since the real UI always binds a real id — is an **expected**
validation problem: it returns a typed `ToggleCheckpointState` result instead of throwing,
and the form renders it inline. Anything past that point — a cookie-store or cache-
invalidation failure — is **unexpected**: a genuine system problem, left to throw naturally
into `app/error.tsx`.

### Dynamic Routing

`/products/[id]` is a dynamic route, rendered per request. `params` is a `Promise` (Next
15's async params), awaited before the lookup. An unknown id calls `notFound()`, which
renders `app/products/[id]/not-found.tsx` as a real 404 response.

### Metadata

`app/layout.tsx` sets a default title (`"LaunchReady"`) and a `"%s | LaunchReady"`
template. `generateMetadata()` on the product page fills in `%s` with the product name —
and deliberately calls `getStaticProduct` (cookie-independent, synchronous), not the
cookie-aware `getProduct`, so a page's title never shifts depending on which checkpoints a
particular visitor has toggled. `not-found.tsx` exports its own static metadata, because
once `notFound()` fires, Next resolves metadata from the not-found segment itself rather
than whatever `generateMetadata()` returned for the failed render.

### URL-backed filtering

The category filter lives in the URL (`?category=Bedding`), not client state.
`app/page.tsx` resolves and validates it server-side against a whitelist built from the
real product data, then filters before rendering. `category-select.tsx` is the only client
code involved, and it does no filtering itself — it just turns a `<select>` change into
`router.push(url, { scroll: false })`, preserving any other query params and removing the
param entirely for "All". The result is shareable, refresh-safe, and participates in
browser back/forward history for free.

## Persistence

The base catalog (`data/products.ts`) is static and immutable at runtime. Toggling a
checkpoint stores only the *diff* from its default value, in a cookie
(`launchready_overrides`, 30-day expiry) as
`{ [productId]: { [checkpointId]: { completed, completedAt } } }`. `completedAt` is an ISO
timestamp set server-side the moment a checkpoint is completed, and cleared to `null` when
it's reopened — never a client-supplied value. Server Components read that cookie and merge
it over the static data before computing readiness/risk (which never touch `completedAt` —
only `completed`). State is per-browser: clearing cookies or opening a private window resets
everything to the defaults.

Cookie persistence was a deliberate scope decision for this take-home, not an external
requirement — it avoids standing up database infrastructure for a single-user demo. The
cookie is client-controlled input, so `lib/products.ts` validates its shape after parsing
(not just that it's JSON, but that it actually matches that shape) and drops anything
malformed rather than crashing the page — including normalizing a legacy plain-boolean
per-checkpoint value (from before `completedAt` existed) rather than dropping it outright.
`toggleCheckpoint` separately validates `productId`/`checkpointId` before ever writing to
the cookie. Write attributes: `httpOnly`, `sameSite: "lax"`, `secure` in production only (so
it still works over plain `http://localhost` in dev).

A real multi-user version would need server-side persistence with authenticated, per-user
ownership, concurrency handling — two tabs toggling the same product near-simultaneously
can currently race, since each reads the cookie before either writes it back — and an
audit trail of who changed what.

## Error Handling

- **Expected validation problem** (bad `productId`/`checkpointId`) → typed
  `ToggleCheckpointState` returned from the action, rendered inline next to the button.
- **Unexpected system/runtime problem** (cookie store, cache invalidation) → thrown,
  caught by `app/error.tsx`.
- **Unknown product id** on the detail route → `notFound()` → the route-level 404
  (`not-found.tsx`), with its own title, not a generic error page.

## Accessibility & Performance

- **Contrast**: `--color-muted` and `--color-risk-medium-ink` were darkened to clear WCAG
  AA (4.5:1) at the small text sizes they're actually used at — the failing ratios are
  recorded as comments in `app/globals.css`.
- **Keyboard parity**: product cards reveal category/readiness on `group-focus-visible` as
  well as on hover, so a keyboard user tabbing onto a card sees what a mouse user sees.
- **Focus visibility**: a consistent focus-visible ring is applied to every interactive
  control (category select, checkpoint buttons, sidebar hamburger/close).
- **Risk is never color-only**: every risk display pairs the tint with a text label
  (`RISK_LABEL`).
- **Progressbar semantics**: the readiness bar has `role="progressbar"` with matching
  `aria-valuenow`/`aria-valuemin`/`aria-valuemax`/`aria-label`.
- **Checkpoint buttons** show status text ("Pending"/"Completed") but carry a unique
  `aria-label` that spells out the action, not six identical status words in one list.
- **Images**: every `fill` image has a real `sizes`; `priority` is only set on the one
  above-the-fold hero image, not on grid/card images.

## Testing

```bash
npm test         # unit tests (Vitest) — pure logic, no browser
npm run test:e2e # E2E tests (Playwright) — real browser against the real app
```

### Unit — Vitest

56 tests across 7 files. Covers: every risk-tier boundary (84% vs. 85%, 59% vs. 60%) and
the critical-checkpoint override (`lib/evaluate-risk.test.ts`); an exhaustive sweep of all
64 completion combinations of the real checkpoint shape confirming readiness is always a
whole integer; every product's checkpoint id set matching the spec exactly, not just a
weight sum that happens to total 100, plus every checkpoint's `completedAt` being
consistent with its `completed` flag (`data/products.test.ts`); the cookie-parsing trust
boundary — malformed shapes are dropped, not thrown, and a legacy plain-boolean checkpoint
value is normalized rather than dropped (`lib/products.test.ts`); UTC-safe completion-date
formatting (`lib/format-date.test.ts`); the category whitelist/fallback logic
(`lib/category.test.ts`); `generateMetadata` producing the right title for a known product
and a sensible fallback for an unknown one (`app/products/[id]/page.test.ts`); and
`toggleCheckpoint` returning a typed error for
invalid input instead of throwing (`app/actions.test.ts`).

### E2E — Playwright

13 tests across 5 spec files, exercising what unit tests can't: an actual page load, an
actual server action round trip, actual cookie persistence, and actual browser history.

- Homepage loads, all 6 products render, category/readiness reveal on hover.
- Clicking a product opens its detail page with the right data and `<title>`.
- Marking a checkpoint complete shows the "Saving…" pending state, then readiness/risk and
  the completion date recompute on screen; reopening it clears the date back to "—"; both
  the completed state and its date survive a reload.
- An unknown product id renders the app's own themed 404, with the correct title.
- Category filtering: a direct `?category=` URL filters server-side; an unrecognized value
  falls back to showing everything; changing category preserves unrelated params, removes
  the param for "All", doesn't scroll to top, and participates in browser back/forward
  history (URL, rendered products, and `<select>` value all restore correctly).
- Mobile nav drawer: the hamburger opens it below `md`, backdrop click and Escape both
  close it (checked via actual on-screen position, since `toBeVisible()` doesn't catch an
  element translated off-screen), a nav link closes it and navigates, and no hamburger
  renders at desktop width.

`playwright.config.ts` starts `npm run dev` itself if nothing's listening on :3000, so
`npm run test:e2e` works standalone. Not currently wired into CI.

## Continuous Integration

`.github/workflows/ci.yml` runs on every push and pull request:

```text
checkout → setup-node (Node 20, npm cache) → npm ci
  → npm run typecheck → npm run lint → npm test → npm run build
```

E2E is intentionally not in CI — keeping the workflow to unit tests, type checking, lint,
and a production build was a deliberate choice to keep it fast and minimal; adding a
`test:e2e` job would be the natural next step for a longer-lived project.

## Running Locally

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Requires Node 20+.

To verify a change the same way CI does:

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

## Project Structure

```text
app/
  actions.ts            # the one Server Action (toggleCheckpoint)
  layout.tsx             # root layout, fonts, metadata template
  error.tsx               # root error boundary
  page.tsx                # homepage
  products/[id]/
    page.tsx              # product detail (dynamic route + generateMetadata)
    not-found.tsx          # route-level 404
components/               # mostly Server Components — 3 of 12 are client
lib/                       # domain logic, persistence, category/date/style helpers
data/products.ts           # static catalog + checkpoint spec (validates itself on load)
types/product.ts           # Product / Checkpoint / RiskLevel
e2e/                       # Playwright specs
.github/workflows/ci.yml   # typecheck → lint → unit tests → build
```

## Key Decisions / Trade-offs

- **Checkpoints as the single source of truth.** Weights and criticality are defined once,
  in `data/products.ts`, and validated at module load (weights must sum to 100, no
  duplicate ids) — a bad edit fails immediately instead of silently producing wrong
  percentages later.
- **Derived readiness/risk instead of stored fields.** `Product` never stores a computed
  value; every render recomputes from checkpoints. Fits a small read-heavy dashboard where
  the source data changes rarely and correctness matters more than shaving a computation.
- **Server Components by default.** Only 4 files need `"use client"`, each for a specific
  reason — keeps the bulk of the app server-rendered with no client-side fetching.
- **URL-backed filtering instead of local component state.** More code in `app/page.tsx`
  than a `useState` filter would need, but makes every filtered view a real, shareable,
  bookmarkable URL for free.
- **Cookie diff instead of a database.** Appropriate for a single-user demo with no
  authentication; would not be the right call for a real multi-user tool.
- **A deterministic risk rule, not a model call.** Risk is a plain threshold function,
  auditable and testable exactly — no AI/ML involved in evaluating it.

## Production Considerations

This is a take-home, not a production system. A real multi-user version would need:
server-side persistence with authenticated, per-user ownership; concurrency/versioning
around concurrent checkpoint edits; an audit history of who changed what and when;
integration with real inventory/ERP/compliance systems (this data is entirely static and
fictional); and observability beyond a `console.error` in the error boundary.

## AI-Assisted Development

Built with Claude Code assisting on implementation, review, testing, and debugging. Every
change was verified with type checking, linting, the unit suite, the E2E suite, and a
production build before being considered done. `CLAUDE.md` is committed as-is — it's the
actual context file used to guide the assistant while working in this repository.

## Time Spent

4 hours. Core requirements (data model, server action, dynamic route) came first;
the rest went into the Vitest/Playwright test suites and CI, an accessibility pass
(contrast, keyboard parity, focus states), the editorial redesign, the mobile nav
drawer, a checkpoint-completion-dates feature added after the initial build, and
keeping this README and CLAUDE.md accurate as all of that landed.

## Assumptions

- Data is entirely fictional (six made-up bedding/bath products); none of it reflects real
  BHF products, vendors, or figures.
- The homepage's Ready / At Risk / Blocked stats map directly to LOW / MEDIUM / HIGH risk
  — there's no separate "readiness" state independent of the risk calculation.
- The dashboard is read/toggle only — no UI to add products or checkpoints; out of scope
  for the assessment's time box.
- Dates are date-only ISO strings (`"2026-09-15"`), formatted in UTC specifically to avoid
  an off-by-one-day bug in timezones behind UTC.

Happy to walk through any part of this in more depth.
