# LaunchReady

LaunchReady is a launch-readiness dashboard for a fictional home-goods catalog: it tracks
which operational checkpoints (pricing, inventory, compliance, etc.) a product still needs
before it ships, and turns that checklist into a readiness percentage and a risk level.
Built with Next.js 15 (App Router), TypeScript, and Tailwind CSS as a take-home assessment.

## Running Locally

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (Node 20+). To verify a change the way
CI does:

```bash
npm run typecheck && npm run lint && npm test && npm run test:e2e && npm run build
```

## Assessment requirements

- Server-rendered list page → `app/page.tsx` (Server Component)
- Server action → `toggleCheckpoint`, `app/actions.ts`
- Dynamic route → `/products/[id]`
- Setup → Next 15 App Router, TypeScript, Tailwind CSS

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

**Readiness** is the sum of completed checkpoints' weights. **Risk** is a separate judgment
that can diverge from it: inventory and compliance are *critical*, so either being
incomplete forces risk to HIGH regardless of readiness. Example: complete except
"Inventory confirmed" → readiness = 75% (MEDIUM on its own), but risk is still **HIGH**.

```text
checkpoints (data/products.ts)  →  readiness = Σ completed weights  (lib/evaluate-risk.ts)
                                 →  risk = HIGH if any critical checkpoint incomplete;
                                            else LOW ≥85%, MEDIUM 60–84%, HIGH <60%
```

That critical-checkpoint check runs first in `evaluateRisk`, short-circuiting the rest.
Readiness/risk are never stored — recomputed on every render, one source of truth.

## Architecture

```text
static product data (data/products.ts) + cookie overrides (lib/products.ts)
        ↓
readiness / risk evaluation (lib/evaluate-risk.ts)
        ↓
Server Components render it (app/page.tsx, app/products/[id]/page.tsx)
        ↓
Server Action mutates a checkpoint (app/actions.ts) → revalidatePath(...)
        ↺ next request re-reads the cookie
```

## Next.js Design

### Server Components

`app/page.tsx` and `app/products/[id]/page.tsx` are both Server Components — cookie reads
and readiness/risk computation happen server-side, no client-side fetching. Nearly all of
`components/` is server-rendered too; **4 client files total** (3 in `components/`, plus
`app/error.tsx`) — see below.

### Client Components

- **`sidebar.tsx`** — open/close state for the mobile nav drawer, plus an
  Escape-key/scroll-lock effect.
- **`category-select.tsx`** — turns a `<select>` change into a URL change.
- **`checkpoint-toggle-form.tsx`** — `useActionState` needs to own the `<form>` to read back
  the action's typed result.
- **`app/error.tsx`** — Next.js requires route error boundaries to be Client Components.

### Server Action

`toggleCheckpoint` (`app/actions.ts`) flips a checkpoint's `completed`/`completedAt`,
persists it as a cookie diff, and revalidates `/` and `/products/[id]`. A bad
`productId`/`checkpointId` (tampered request) returns a typed `ToggleCheckpointState`
instead of throwing, rendered inline. Anything past that (cookie/cache failure) throws to
`app/error.tsx`.

### Dynamic Routing

`/products/[id]`, rendered per request. `params` is a `Promise` (Next 15), awaited before
lookup. An unknown id calls `notFound()`, rendering `not-found.tsx` as a real 404.

### Metadata

Root layout sets a `"%s | LaunchReady"` title template; `generateMetadata()` fills in the
product name using `getStaticProduct` (cookie-independent), so the title never depends on a
visitor's toggled checkpoints. `not-found.tsx` needs its own metadata export, since Next
resolves it from that segment once `notFound()` fires.

### URL-backed filtering

`?category=Bedding` is resolved and validated server-side in `app/page.tsx`, not client
state. `category-select.tsx` only turns a `<select>` change into
`router.push(url, { scroll: false })`, preserving other params and dropping the param for
"All" — shareable, refresh-safe, and part of browser history.

## Persistence

Checkpoint changes persist as a diff in a cookie (`launchready_overrides`, 30-day expiry):
`{ [productId]: { [checkpointId]: { completed, completedAt } } }`. `completedAt` is set
server-side, never client-supplied. A deliberate scope choice, not an external
requirement — avoids database infrastructure for a single-user demo.

The cookie is client-controlled input, so `lib/products.ts` validates its shape after
parsing (including normalizing a legacy plain-boolean format) and drops anything malformed.
Cookie attributes: `httpOnly`, `sameSite: "lax"`, `secure` in production only. A real
multi-user version would need server-side persistence, per-user ownership, concurrency
handling (two tabs racing is a known gap here), and an audit trail.

## Accessibility & Performance

- Two color tokens darkened to clear WCAG AA 4.5:1 (`--color-muted`,
  `--color-risk-medium-ink`).
- Product cards reveal category/readiness on `group-focus-visible`, not just hover.
- Consistent focus-visible ring on every interactive control.
- Risk is always text + color, never color alone.
- Readiness bar uses `role="progressbar"` with matching `aria-value*`.
- Checkpoint buttons carry a unique `aria-label` spelling out the action.
- Every `fill` image has real `sizes`; `priority` only on the hero image.

## Testing

```bash
npm test         # unit tests (Vitest)
npm run test:e2e # E2E tests (Playwright)
```

**Unit** — 56 tests, 7 files:
- Readiness/risk math: every risk-tier boundary, the critical-checkpoint override.
- `data/products.ts` invariants: checkpoint weights/ids, `completedAt` consistency.
- Cookie-parsing trust boundary, including legacy-format backward compatibility.
- `generateMetadata`/`toggleCheckpoint` edge cases.

**E2E** — 13 tests, 5 specs:
- Homepage → product navigation.
- Checkpoint toggle round trip: pending state, readiness/risk, completion date, reload.
- Category filtering: direct URL, invalid fallback, param preservation, browser history.
- Mobile nav drawer, and the themed 404.

CI (`.github/workflows/ci.yml`, every push/PR): `checkout → setup-node → npm ci →
typecheck → lint → test → build`. E2E isn't wired in, to keep the workflow fast.

## Project Structure

```text
app/
  actions.ts              # the one Server Action (toggleCheckpoint)
  layout.tsx / error.tsx / page.tsx
  products/[id]/page.tsx      # dynamic route + generateMetadata
  products/[id]/not-found.tsx
components/                # 4 client files total (3 here, plus app/error.tsx) — rest server
lib/                       # domain logic, persistence, category/date/style helpers
data/products.ts           # static catalog + checkpoint spec (validates itself on load)
types/product.ts           # Product / Checkpoint / RiskLevel
e2e/                       # Playwright specs
.github/workflows/ci.yml   # typecheck → lint → unit tests → build
```

## Key Decisions / Trade-offs

- **Checkpoints as the single source of truth** — weights/criticality defined once, in
  `data/products.ts`.
- **Derived readiness/risk, never stored** — every render recomputes from checkpoints.
- **Server Components by default** — only 4 files need `"use client"`.
- **URL-backed filtering over local state** — every filtered view is a real, shareable URL.
- **Cookie diff over a database** — right for a single-user demo, not a real multi-user tool.
- **A deterministic risk rule, not a model call** — auditable and exactly testable.

## Production Considerations

This is a take-home, not a production system. A real multi-user version would need:
server-side persistence with authenticated, per-user ownership; concurrency/versioning; an
audit history; integration with real inventory/ERP/compliance systems (this data is
entirely static/fictional); and observability beyond a `console.error`.

## AI-Assisted Development

Built with Claude Code assisting on implementation, review, testing, and debugging. Every
change was verified with type checking, linting, both test suites, and a production build.
`CLAUDE.md` is committed as-is — the actual context file used to guide it.

## Time Spent

~3 hours on the core requirements. I chose to spend a few more on the test suites/CI, an
accessibility pass, the editorial redesign, the mobile nav drawer, and a
checkpoint-completion-dates feature — because that's how I'd actually ship this, not
because the brief asked for it.

## Assumptions

- Data is entirely fictional; none of it reflects real BHF products, vendors, or figures.
- Homepage's Ready/At Risk/Blocked stats map directly to LOW/MEDIUM/HIGH risk.
- Read/toggle only — no UI to add products or checkpoints.
- Dates are date-only ISO strings, formatted in UTC to avoid an off-by-one-day bug.
