"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { PRODUCTS } from "@/data/products";
import { OVERRIDES_COOKIE, readOverrides } from "@/lib/products";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// "Expected" failures — bad input, the kind a tampered request could trigger — return this
// typed state so the form can show it inline. This is deliberately the only failure mode
// that returns rather than throws: a validation problem is not a system failure. Anything
// that goes wrong after validation (cookie store, cache invalidation) is "unexpected" and
// is left to throw naturally, which app/error.tsx handles — see the comment below the
// validation check for where that boundary sits.
export type ToggleCheckpointState =
  | { status: "idle" }
  | { status: "error"; message: string };

/**
 * Toggles one checkpoint's completed state for one product.
 * Persists the change as a diff in a cookie (no database for this assessment),
 * then revalidates the pages that depend on it so readiness/risk recompute.
 *
 * Signature matches what useActionState expects once productId/checkpointId are bound
 * (see components/checkpoint-toggle-form.tsx): the two bound args come first, then
 * (prevState, formData) are supplied by the hook.
 */
export async function toggleCheckpoint(
  productId: string,
  checkpointId: string,
  _prevState: ToggleCheckpointState,
  _formData: FormData
): Promise<ToggleCheckpointState> {
  const product = PRODUCTS.find((p) => p.id === productId);
  const checkpoint = product?.checkpoints.find((c) => c.id === checkpointId);
  if (!product || !checkpoint) {
    // Expected: only reachable via a tampered request (the real UI always binds a real
    // id via .bind() on the server-rendered form), but it's a validation problem, not a
    // system failure — report it, don't throw.
    return {
      status: "error",
      message: "That checkpoint couldn't be found. Reload the page and try again.",
    };
  }

  const overrides = await readOverrides();
  const currentlyCompleted = overrides[productId]?.[checkpointId]?.completed ?? checkpoint.completed;
  const nextCompleted = !currentlyCompleted;

  overrides[productId] = {
    ...overrides[productId],
    [checkpointId]: {
      completed: nextCompleted,
      // Set on the server, not trusted from the client — matches every other value this
      // action writes (productId/checkpointId already validated above).
      completedAt: nextCompleted ? new Date().toISOString() : null,
    },
  };

  // Unexpected from here down: a cookie-store or cache-invalidation failure is a real
  // system problem, not something the user did — let it throw to app/error.tsx rather
  // than silently swallowing it into the inline error state above.
  const store = await cookies();
  store.set(OVERRIDES_COOKIE, JSON.stringify(overrides), {
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    httpOnly: true, // only ever read server-side (lib/products.ts); no client JS needs it
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production", // avoids Secure-cookie quirks on http://localhost
  });

  revalidatePath(`/products/${productId}`);
  revalidatePath("/");

  return { status: "idle" };
}
