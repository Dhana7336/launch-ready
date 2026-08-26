import type { Product, Checkpoint } from "@/types/product";

type CheckpointSpec = Omit<Checkpoint, "completed">;

// Matches the six standard launch checkpoints and their weights/criticality.
// Weights sum to 100 across every product.
const CHECKPOINT_SPECS: CheckpointSpec[] = [
  { id: "info", label: "Product information complete", weight: 15, critical: false },
  { id: "pricing", label: "Pricing approved", weight: 15, critical: false },
  { id: "images", label: "Product images approved", weight: 15, critical: false },
  { id: "inventory", label: "Inventory confirmed", weight: 25, critical: true },
  { id: "shipping", label: "Shipping configured", weight: 15, critical: false },
  { id: "compliance", label: "Compliance approved", weight: 15, critical: true },
];

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
    checkpoints: buildCheckpoints(["shipping"]),
  },
  {
    id: "premium-quilt-collection",
    name: "Premium Quilt Collection",
    category: "Bedding",
    owner: "Sofia Torres",
    launchDate: "2026-09-20",
    checkpoints: buildCheckpoints(["pricing"]),
  },
  {
    id: "classic-cotton-collection",
    name: "Classic Cotton Collection",
    category: "Bedding",
    owner: "James Wu",
    launchDate: "2026-09-22",
    checkpoints: buildCheckpoints(["images", "shipping"]),
  },
  {
    id: "kids-bedding-collection",
    name: "Kids Bedding Collection",
    category: "Kids",
    owner: "Alex Kim",
    launchDate: "2026-10-04",
    checkpoints: buildCheckpoints(["pricing", "images"]),
  },
  {
    id: "essential-bath-set",
    name: "Essential Bath Set",
    category: "Bath",
    owner: "Devon Brooks",
    launchDate: "2026-09-29",
    checkpoints: buildCheckpoints(["info", "shipping"]),
  },
  {
    id: "luxury-sheet-set",
    name: "Luxury Sheet Set",
    category: "Bedding",
    owner: "Priya Nair",
    launchDate: "2026-09-28",
    checkpoints: buildCheckpoints(["inventory", "compliance", "shipping"]),
  },
];
