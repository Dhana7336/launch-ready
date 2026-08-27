import { describe, expect, it } from "vitest";
import type { Checkpoint } from "@/types/product";
import { calculateReadiness, evaluateRisk, hasCriticalBlocker, remainingTasks } from "./evaluate-risk";

function checkpoint(overrides: Partial<Checkpoint> = {}): Checkpoint {
  return {
    id: "test",
    label: "Test checkpoint",
    completed: false,
    completedAt: null,
    weight: 10,
    critical: false,
    ...overrides,
  };
}

describe("calculateReadiness", () => {
  it("returns 0 for an empty checkpoint list", () => {
    expect(calculateReadiness([])).toBe(0);
  });

  it("sums the weight of completed checkpoints only", () => {
    const checkpoints = [
      checkpoint({ id: "a", weight: 30, completed: true }),
      checkpoint({ id: "b", weight: 20, completed: false }),
      checkpoint({ id: "c", weight: 50, completed: true }),
    ];
    expect(calculateReadiness(checkpoints)).toBe(80);
  });

  it("returns 100 when every checkpoint is complete and weights sum to 100", () => {
    const checkpoints = [
      checkpoint({ id: "a", weight: 40, completed: true }),
      checkpoint({ id: "b", weight: 60, completed: true }),
    ];
    expect(calculateReadiness(checkpoints)).toBe(100);
  });
});

describe("hasCriticalBlocker", () => {
  it("is false when no checkpoints are critical", () => {
    expect(hasCriticalBlocker([checkpoint({ critical: false, completed: false })])).toBe(false);
  });

  it("is false when every critical checkpoint is complete", () => {
    expect(hasCriticalBlocker([checkpoint({ critical: true, completed: true })])).toBe(false);
  });

  it("is true when any critical checkpoint is incomplete", () => {
    const checkpoints = [
      checkpoint({ id: "a", critical: true, completed: true }),
      checkpoint({ id: "b", critical: true, completed: false }),
    ];
    expect(hasCriticalBlocker(checkpoints)).toBe(true);
  });
});

// Builds a checkpoint list whose calculateReadiness() result is exactly `readiness`,
// optionally adding a zero-weight critical checkpoint so the critical-override path
// can be tested independently of the readiness percentage.
function withReadiness(
  readiness: number,
  critical = false,
  criticalComplete = true
): Checkpoint[] {
  const checkpoints: Checkpoint[] = [];
  if (readiness > 0) {
    checkpoints.push(checkpoint({ id: "main", weight: readiness, completed: true }));
  }
  if (readiness < 100) {
    checkpoints.push(checkpoint({ id: "rest", weight: 100 - readiness, completed: false }));
  }
  if (critical) {
    checkpoints.push(
      checkpoint({ id: "critical", weight: 0, critical: true, completed: criticalComplete })
    );
  }
  return checkpoints;
}

describe("evaluateRisk", () => {
  it("is LOW at exactly the 85% boundary with no critical blocker", () => {
    expect(evaluateRisk(withReadiness(85))).toBe("LOW");
  });

  it("is MEDIUM one point below the LOW boundary (84%)", () => {
    expect(evaluateRisk(withReadiness(84))).toBe("MEDIUM");
  });

  it("is MEDIUM at exactly the 60% boundary with no critical blocker", () => {
    expect(evaluateRisk(withReadiness(60))).toBe("MEDIUM");
  });

  it("is HIGH one point below the MEDIUM boundary (59%)", () => {
    expect(evaluateRisk(withReadiness(59))).toBe("HIGH");
  });

  it("is HIGH at 0% readiness", () => {
    expect(evaluateRisk(withReadiness(0))).toBe("HIGH");
  });

  it("is HIGH for an empty checkpoint list (conservative default)", () => {
    expect(evaluateRisk([])).toBe("HIGH");
  });

  it("is HIGH when a critical checkpoint is incomplete, even at 100% readiness otherwise", () => {
    expect(evaluateRisk(withReadiness(100, true, false))).toBe("HIGH");
  });

  it("is LOW when all critical checkpoints are complete and readiness clears 85%", () => {
    expect(evaluateRisk(withReadiness(90, true, true))).toBe("LOW");
  });
});

// Mirrors the real checkpoint shape in data/products.ts (6 checkpoints, weights summing
// to 100, two critical at 25% and 15%) without importing from data/ — these are lib-level
// unit tests and shouldn't break because something unrelated changed in data/products.ts.
const REALISTIC_SPECS: { id: string; weight: number; critical: boolean }[] = [
  { id: "info", weight: 15, critical: false },
  { id: "pricing", weight: 15, critical: false },
  { id: "images", weight: 15, critical: false },
  { id: "inventory", weight: 25, critical: true },
  { id: "shipping", weight: 15, critical: false },
  { id: "compliance", weight: 15, critical: true },
];

function realisticCheckpoints(incompleteIds: string[] = []): Checkpoint[] {
  return REALISTIC_SPECS.map((spec) =>
    checkpoint({ ...spec, label: spec.id, completed: !incompleteIds.includes(spec.id) })
  );
}

describe("a realistic full product, not just isolated inputs", () => {
  it("goes HIGH -> LOW as the last incomplete critical checkpoint is toggled complete", () => {
    // Everything done except the critical "inventory" checkpoint (25% weight).
    let checkpoints = realisticCheckpoints(["inventory"]);
    expect(calculateReadiness(checkpoints)).toBe(75);
    expect(evaluateRisk(checkpoints)).toBe("HIGH"); // critical blocker overrides the 75%

    // Toggle "inventory" complete, the same way the toggleCheckpoint server action would
    // (recompute from a fresh checkpoint list, nothing cached).
    checkpoints = checkpoints.map((c) =>
      c.id === "inventory" ? { ...c, completed: true } : c
    );
    expect(calculateReadiness(checkpoints)).toBe(100);
    expect(evaluateRisk(checkpoints)).toBe("LOW");
  });

  it("moves LOW -> MEDIUM -> HIGH as non-critical checkpoints are toggled off one at a time", () => {
    let checkpoints = realisticCheckpoints(); // all complete: 100%, LOW
    expect(evaluateRisk(checkpoints)).toBe("LOW");

    // Turn off "shipping" (15%): 85% - right at the LOW boundary, still LOW.
    checkpoints = checkpoints.map((c) => (c.id === "shipping" ? { ...c, completed: false } : c));
    expect(calculateReadiness(checkpoints)).toBe(85);
    expect(evaluateRisk(checkpoints)).toBe("LOW");

    // Also turn off "images" (15%): 70% - MEDIUM.
    checkpoints = checkpoints.map((c) => (c.id === "images" ? { ...c, completed: false } : c));
    expect(calculateReadiness(checkpoints)).toBe(70);
    expect(evaluateRisk(checkpoints)).toBe("MEDIUM");

    // Also turn off "pricing" (15%): 55% - HIGH via the readiness threshold, not a critical
    // blocker (both critical checkpoints are still complete here).
    checkpoints = checkpoints.map((c) => (c.id === "pricing" ? { ...c, completed: false } : c));
    expect(calculateReadiness(checkpoints)).toBe(55);
    expect(hasCriticalBlocker(checkpoints)).toBe(false);
    expect(evaluateRisk(checkpoints)).toBe("HIGH");
  });
});

describe("readiness is integer-safe", () => {
  it("is a whole number between 0 and 100 for every completion combination of a real product", () => {
    // Exhaustively try every complete/incomplete combination of the 6 real checkpoints
    // (2^6 = 64) rather than spot-checking a few, so there's no gap where a fractional
    // result could slip through unnoticed.
    for (let mask = 0; mask < 1 << REALISTIC_SPECS.length; mask++) {
      const incompleteIds = REALISTIC_SPECS.filter((_, i) => !(mask & (1 << i))).map(
        (s) => s.id
      );
      const readiness = calculateReadiness(realisticCheckpoints(incompleteIds));
      expect(Number.isInteger(readiness), `mask ${mask} -> ${readiness}`).toBe(true);
      expect(readiness).toBeGreaterThanOrEqual(0);
      expect(readiness).toBeLessThanOrEqual(100);
    }
  });
});

describe("remainingTasks", () => {
  it("returns only incomplete checkpoints, in order", () => {
    const checkpoints = [
      checkpoint({ id: "a", completed: true }),
      checkpoint({ id: "b", completed: false }),
      checkpoint({ id: "c", completed: false }),
    ];
    expect(remainingTasks(checkpoints).map((c) => c.id)).toEqual(["b", "c"]);
  });

  it("returns an empty array when everything is complete", () => {
    expect(remainingTasks([checkpoint({ completed: true })])).toEqual([]);
  });
});
