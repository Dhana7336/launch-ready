"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { PRODUCTS } from "@/data/products";
import { OVERRIDES_COOKIE, readOverrides } from "@/lib/products";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Toggles one checkpoint's completed state for one product.
 * Persists the change as a diff in a cookie (no database for this assessment),
 * then revalidates the pages that depend on it so readiness/risk recompute.
 */
export async function toggleCheckpoint(productId: string, checkpointId: string) {
  const product = PRODUCTS.find((p) => p.id === productId);
  const checkpoint = product?.checkpoints.find((c) => c.id === checkpointId);
  if (!product || !checkpoint) {
    throw new Error(`Unknown product/checkpoint: ${productId}/${checkpointId}`);
  }

  const overrides = await readOverrides();
  const currentlyCompleted = overrides[productId]?.[checkpointId] ?? checkpoint.completed;

  overrides[productId] = {
    ...overrides[productId],
    [checkpointId]: !currentlyCompleted,
  };

  const store = await cookies();
  store.set(OVERRIDES_COOKIE, JSON.stringify(overrides), {
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  revalidatePath(`/products/${productId}`);
  revalidatePath("/");
}
