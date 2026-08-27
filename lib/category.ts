import type { Product } from "@/types/product";

// Pastel surface tokens per product category, shared by every place a category
// tag is rendered so the mapping lives in exactly one place.
const CATEGORY_TINT: Record<string, string> = {
  Bedding: "bg-sage-soft",
  Kids: "bg-blush",
  Bath: "bg-sand",
};

export function categoryTint(category: string): string {
  return CATEGORY_TINT[category] ?? "bg-sage-soft";
}

// Sentinel for "no category filter" — deliberately not a real category string, and
// deliberately never written to the URL (the ?category param is removed entirely for it).
export const ALL_CATEGORIES = "all";

// The whitelist is derived from real product data rather than a hardcoded list, so it
// can't drift out of sync with what products actually exist. Order matches first
// appearance in `products`, which is also the display order in the <select>.
export function getCategoryOptions(products: Product[]): string[] {
  return Array.from(new Set(products.map((p) => p.category)));
}

// Validates a raw, client-supplied ?category value against the real whitelist. Anything
// missing or unrecognized (typo, stale link, tampered URL) safely falls back to "all"
// rather than filtering to an empty/invalid result.
export function resolveCategory(categories: string[], requested: string | undefined): string {
  if (requested && categories.includes(requested)) {
    return requested;
  }
  return ALL_CATEGORIES;
}
