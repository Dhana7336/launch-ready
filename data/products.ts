import type { Product, Checkpoint } from "@/types/product";

export type CheckpointSpec = Omit<Checkpoint, "completed">;

// Matches the six standard launch checkpoints and their weights/criticality. Every
// product's checkpoint list is built from exactly this spec (see buildCheckpoints below),
// so it's also the single place data/products.test.ts checks each product against.
// Weights sum to 100 across every product.
export const CHECKPOINT_SPECS: CheckpointSpec[] = [
  { id: "info", label: "Product information complete", weight: 15, critical: false },
  { id: "pricing", label: "Pricing approved", weight: 15, critical: false },
  { id: "images", label: "Product images approved", weight: 15, critical: false },
  { id: "inventory", label: "Inventory confirmed", weight: 25, critical: true },
  { id: "shipping", label: "Shipping configured", weight: 15, critical: false },
  { id: "compliance", label: "Compliance approved", weight: 15, critical: true },
];

// calculateReadiness() sums the weight of completed checkpoints, so that sum only means
// "percent ready" if the weights actually total 100. Enforce it at module load rather than
// trusting the comment above to stay accurate as CHECKPOINT_SPECS changes.
const TOTAL_WEIGHT = CHECKPOINT_SPECS.reduce((sum, spec) => sum + spec.weight, 0);
if (TOTAL_WEIGHT !== 100) {
  throw new Error(
    `CHECKPOINT_SPECS weights must sum to 100, got ${TOTAL_WEIGHT}. Fix data/products.ts.`
  );
}

// A duplicate id would make buildCheckpoints() silently produce two checkpoints with the
// same id for every product — toggleCheckpoint/applyOverrides key off id, so this would
// let one checkpoint's toggle secretly affect another. Catch it at module load, and name
// the actual colliding id(s) rather than just "duplicate ids somewhere".
const seenIds = new Set<string>();
const duplicateIds = new Set<string>();
for (const spec of CHECKPOINT_SPECS) {
  if (seenIds.has(spec.id)) duplicateIds.add(spec.id);
  seenIds.add(spec.id);
}
if (duplicateIds.size > 0) {
  throw new Error(
    `CHECKPOINT_SPECS has duplicate checkpoint id(s): ${[...duplicateIds].join(", ")}. Fix data/products.ts.`
  );
}

function buildCheckpoints(incompleteIds: string[]): Checkpoint[] {
  return CHECKPOINT_SPECS.map((spec) => ({
    ...spec,
    completed: !incompleteIds.includes(spec.id),
  }));
}

// Fictional products for demo purposes only — not real BHF data.
export const PRODUCTS: Product[] = [
  {
    id: "spring-comfort-set",
    name: "Spring Comfort Set",
    category: "Bedding",
    owner: "Maria Chen",
    launchDate: "2026-09-15",
    image: "/images/products/spring-comfort-set.jpg",
    checkpoints: buildCheckpoints(["shipping"]),
  },
  {
    id: "premium-quilt-collection",
    name: "Premium Quilt Collection",
    category: "Bedding",
    owner: "Sofia Torres",
    launchDate: "2026-09-20",
    image: "/images/products/premium-quilt-collection.jpg",
    checkpoints: buildCheckpoints(["pricing"]),
  },
  {
    id: "classic-cotton-collection",
    name: "Classic Cotton Collection",
    category: "Bedding",
    owner: "James Wu",
    launchDate: "2026-09-22",
    image: "/images/products/classic-cotton-collection.jpg",
    checkpoints: buildCheckpoints(["images", "shipping"]),
  },
  {
    id: "kids-bedding-collection",
    name: "Kids Bedding Collection",
    category: "Kids",
    owner: "Alex Kim",
    launchDate: "2026-10-04",
    image: "/images/products/kids-bedding-collection.jpg",
    checkpoints: buildCheckpoints(["pricing", "images"]),
  },
  {
    id: "essential-bath-set",
    name: "Essential Bath Set",
    category: "Bath",
    owner: "Devon Brooks",
    launchDate: "2026-09-29",
    image: "/images/products/essential-bath-set.jpg",
    checkpoints: buildCheckpoints(["info", "shipping"]),
  },
  {
    id: "luxury-sheet-set",
    name: "Luxury Sheet Set",
    category: "Bedding",
    owner: "Priya Nair",
    launchDate: "2026-09-28",
    image: "/images/products/luxury-sheet-set.jpg",
    checkpoints: buildCheckpoints(["inventory", "compliance", "shipping"]),
  },
];
