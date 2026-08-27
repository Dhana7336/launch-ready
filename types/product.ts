export type Checkpoint = {
  id: string;
  label: string;
  completed: boolean;
  /** ISO timestamp of when this checkpoint was marked complete; null while incomplete. */
  completedAt: string | null;
  /** Percentage of the readiness score this checkpoint contributes when complete. */
  weight: number;
  /** Critical checkpoints force HIGH risk when incomplete, regardless of overall readiness. */
  critical: boolean;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  owner: string;
  /** ISO date string, e.g. "2026-09-15". */
  launchDate: string;
  /** Path to a product photo under /public. */
  image: string;
  checkpoints: Checkpoint[];
};

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
