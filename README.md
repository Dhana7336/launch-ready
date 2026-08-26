# LaunchReady

A small Next.js dashboard for tracking product launch readiness and automatically
flagging risk. Built for the Next.js take-home assessment (Software Engineer, Full
Stack & Automation — BHF).

## Stack

- Next.js 15 (App Router), TypeScript, Tailwind CSS
- No database — see [Persistence](#persistence) below

## Running it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts: `npm run build`, `npm start` (production server), `npm run lint`.

## What it does

**Homepage (`/`)** — a Server Component that renders six fictional products (`data/products.ts`)
with their launch date, readiness %, and risk level, plus summary stats (Products / Ready /
At Risk / Blocked). Rendered entirely on the server; no client-side data fetching.

**Product detail (`/products/[id]`)** — the dynamic route. Shows one product's launch
readiness checklist, its readiness bar, and its risk evaluation. An unknown `id` renders
the `not-found.tsx` page (404).

**Server action (`app/actions.ts` → `toggleCheckpoint`)** — clicking "Mark Complete" /
"Mark Incomplete" next to any checklist item submits a form bound to this server action.
It flips that checkpoint's completed state, persists the change (see below), and calls
`revalidatePath()` on both the detail page and the homepage. Readiness % and risk level
are never stored — they're recalculated from the checkpoint list on every render, so the
change is immediately reflected in both places. Each checklist row is its own `<form
action={...}>`, so this works even without client-side JavaScript.

## Readiness & risk model

Every product has 6 checkpoints with fixed weights (sum to 100%):

| Checkpoint | Weight | Critical? |
|---|---|---|
| Product information | 15% | No |
| Pricing approved | 15% | No |
| Product images | 15% | No |
| Inventory confirmed | 25% | Yes |
| Shipping configured | 15% | No |
| Compliance approved | 15% | Yes |

Readiness % = sum of weights of completed checkpoints. Risk is a plain rule (`lib/evaluate-risk.ts`),
no ML/AI involved:

- **LOW** — readiness ≥ 85% and no critical checkpoint incomplete
- **MEDIUM** — readiness 60–84% and no critical checkpoint incomplete
- **HIGH** — readiness < 60%, OR any critical checkpoint (inventory/compliance) is incomplete

A critical checkpoint being incomplete forces HIGH regardless of overall readiness %, since
launching without confirmed inventory or compliance approval is a hard blocker.

## Persistence

Per the assessment's suggestion to avoid standing up a database for this exercise: the base
product/checkpoint data in `data/products.ts` is static. When you toggle a checkpoint, the
*diff* from that default is stored in a browser cookie (`launchready_overrides`, 30-day
expiry) as `{ [productId]: { [checkpointId]: completed } }`. Server Components read the
cookie on each request and merge it over the static data before computing readiness/risk.
This means state is per-browser, not shared across visitors or persisted server-side —
clearing cookies or opening a private window resets everything to the default data.

## Assumptions

- Data is entirely fictional (six made-up bedding/bath products); none of it reflects
  real BHF products, vendors, or figures.
- "Ready / At Risk / Blocked" on the homepage stats map directly to LOW / MEDIUM / HIGH
  risk — there's no separate "readiness" state independent of the risk calculation.
- The dashboard is read/toggle only — there's no way to add new products or checkpoints
  through the UI; that felt out of scope for the assessment's time box.
- Dates are stored as date-only ISO strings (`"2026-09-15"`) and formatted in UTC
  specifically to avoid an off-by-one-day bug where the viewer's local timezone shifts
  the displayed date backward.

## AI assistant use

This project was built with Claude Code. `CLAUDE.md` is committed as-is and is the actual
context file used to guide the implementation.

## Time spent

~2.5 hours, including planning the data model, implementation, fixing a timezone date bug
found during manual browser testing (Playwright), and writing this README.
