import "server-only";
import { cookies } from "next/headers";
import { PRODUCTS } from "@/data/products";
import type { Product } from "@/types/product";

export const OVERRIDES_COOKIE = "launchready_overrides";

// Maps productId -> checkpointId -> completed, for checkpoints the visitor has toggled
// away from their default value. Only diffs are stored, keeping the cookie small.
export type Overrides = Record<string, Record<string, boolean>>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// The cookie is arbitrary client-controlled input (editable via devtools), so this is a
// trust boundary: valid JSON with the wrong shape (e.g. a string where a checkpoint map
// should be) must never reach applyOverrides, which uses the `in` operator and throws on
// a non-object. Anything that doesn't match the expected shape is dropped silently rather
// than crashing the page — internal invariants (data/products.ts) fail loudly because
// they're developer-authored; user-supplied input degrades gracefully instead.
export function parseOverrides(raw: string | undefined): Overrides {
  if (!raw) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!isPlainObject(parsed)) return {};

  const result: Overrides = {};
  for (const [productId, productOverrides] of Object.entries(parsed)) {
    if (!isPlainObject(productOverrides)) continue;

    const checkpointOverrides: Record<string, boolean> = {};
    for (const [checkpointId, completed] of Object.entries(productOverrides)) {
      if (typeof completed === "boolean") {
        checkpointOverrides[checkpointId] = completed;
      }
    }
    if (Object.keys(checkpointOverrides).length > 0) {
      result[productId] = checkpointOverrides;
    }
  }
  return result;
}

export async function readOverrides(): Promise<Overrides> {
  const store = await cookies();
  return parseOverrides(store.get(OVERRIDES_COOKIE)?.value);
}

export function applyOverrides(products: Product[], overrides: Overrides): Product[] {
  return products.map((product) => {
    const productOverrides = overrides[product.id];
    if (!productOverrides) return product;
    return {
      ...product,
      checkpoints: product.checkpoints.map((checkpoint) =>
        checkpoint.id in productOverrides
          ? { ...checkpoint, completed: productOverrides[checkpoint.id] }
          : checkpoint
      ),
    };
  });
}

export async function getProducts(): Promise<Product[]> {
  const overrides = await readOverrides();
  return applyOverrides(PRODUCTS, overrides);
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((p) => p.id === id);
}

// Cookie-independent lookup, for contexts that must never depend on session state — e.g.
// generateMetadata() in app/products/[id]/page.tsx. Deliberately synchronous: it can't
// reach for cookies()/readOverrides() even by accident, since those are async. Only
// product *identity* (name, category, dates) is static/session-independent — readiness
// and risk are derived from checkpoints, which the cookie can override, so nothing that
// touches them should ever be computed from this lookup's result.
export function getStaticProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
