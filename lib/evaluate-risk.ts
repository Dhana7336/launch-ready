import type { Checkpoint, RiskLevel } from "@/types/product";

export function calculateReadiness(checkpoints: Checkpoint[]): number {
  return checkpoints.reduce((sum, c) => sum + (c.completed ? c.weight : 0), 0);
}

export function hasCriticalBlocker(checkpoints: Checkpoint[]): boolean {
  return checkpoints.some((c) => c.critical && !c.completed);
}

/**
 * LOW: readiness >= 85% and no critical checkpoint incomplete.
 * MEDIUM: readiness 60-84% and no critical checkpoint incomplete.
 * HIGH: readiness < 60%, or any critical checkpoint incomplete (e.g. inventory, compliance).
 */
export function evaluateRisk(checkpoints: Checkpoint[]): RiskLevel {
  if (hasCriticalBlocker(checkpoints)) return "HIGH";

  const readiness = calculateReadiness(checkpoints);
  if (readiness >= 85) return "LOW";
  if (readiness >= 60) return "MEDIUM";
  return "HIGH";
}

export function remainingTasks(checkpoints: Checkpoint[]): Checkpoint[] {
  return checkpoints.filter((c) => !c.completed);
}
