import { cookies } from "next/headers";
import { PRODUCTS } from "@/data/products";
import type { Product } from "@/types/product";

export const OVERRIDES_COOKIE = "launchready_overrides";

// Maps productId -> checkpointId -> completed, for checkpoints the visitor has toggled
// away from their default value. Only diffs are stored, keeping the cookie small.
type Overrides = Record<string, Record<string, boolean>>;

export async function readOverrides(): Promise<Overrides> {
  const store = await cookies();
  const raw = store.get(OVERRIDES_COOKIE)?.value;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Overrides;
  } catch {
    return {};
  }
}

function applyOverrides(products: Product[], overrides: Overrides): Product[] {
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
