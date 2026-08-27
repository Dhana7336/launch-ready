import { describe, expect, it } from "vitest";
import { CHECKPOINT_SPECS, PRODUCTS } from "./products";

const EXPECTED_CHECKPOINT_IDS = new Set(CHECKPOINT_SPECS.map((spec) => spec.id));

describe("PRODUCTS", () => {
  it("has at least one product", () => {
    expect(PRODUCTS.length).toBeGreaterThan(0);
  });

  it("gives every product checkpoint weights that sum to exactly 100", () => {
    for (const product of PRODUCTS) {
      const total = product.checkpoints.reduce((sum, c) => sum + c.weight, 0);
      expect(total, `${product.id} checkpoint weights`).toBe(100);
    }
  });

  it("gives every product checkpoint ids that are unique within that product", () => {
    // A weight sum of 100 doesn't prove correctness on its own: two checkpoints sharing an
    // id would double-count that id's weight in the sum below, and would also make
    // toggleCheckpoint/applyOverrides (which key off id) affect both at once.
    for (const product of PRODUCTS) {
      const ids = product.checkpoints.map((c) => c.id);
      expect(new Set(ids).size, `${product.id} checkpoint ids`).toBe(ids.length);
    }
  });

  it("gives every product exactly the expected checkpoint set, not just a matching weight sum", () => {
    // A product could be missing "compliance" and have a duplicated "info" instead and
    // still sum to 100 — this checks the actual id set, not just the total.
    for (const product of PRODUCTS) {
      const ids = new Set(product.checkpoints.map((c) => c.id));
      expect(ids, product.id).toEqual(EXPECTED_CHECKPOINT_IDS);
    }
  });

  it("gives every product a unique id", () => {
    const ids = PRODUCTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("CHECKPOINT_SPECS", () => {
  it("has unique checkpoint ids", () => {
    const ids = CHECKPOINT_SPECS.map((spec) => spec.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has integer weights, so calculateReadiness can never produce a fractional result", () => {
    for (const spec of CHECKPOINT_SPECS) {
      expect(Number.isInteger(spec.weight), spec.id).toBe(true);
    }
  });
});
