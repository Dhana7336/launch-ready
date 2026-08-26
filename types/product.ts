export type Checkpoint = {
  id: string;
  label: string;
  completed: boolean;
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
  checkpoints: Checkpoint[];
};

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
