import { describe, expect, it } from "vitest";
import type { Product } from "@/types/product";
import { applyOverrides, getStaticProduct, parseOverrides } from "./products";

describe("parseOverrides", () => {
  it("returns {} when there is no cookie value", () => {
    expect(parseOverrides(undefined)).toEqual({});
    expect(parseOverrides("")).toEqual({});
  });

  it("returns {} for malformed JSON instead of throwing", () => {
    expect(parseOverrides("not json{")).toEqual({});
  });

  // Valid JSON with the wrong shape is the dangerous case: it passes JSON.parse, so a
  // naive `JSON.parse(raw) as Overrides` cast would let it through to applyOverrides,
  // which uses the `in` operator and throws on a non-object (see products.ts comment).
  it("returns {} when the top-level value is valid JSON but not an object", () => {
    expect(parseOverrides('"just a string"')).toEqual({});
    expect(parseOverrides("42")).toEqual({});
    expect(parseOverrides("true")).toEqual({});
    expect(parseOverrides("null")).toEqual({});
    expect(parseOverrides("[1,2,3]")).toEqual({});
  });

  it("drops a product's entry when its value isn't an object, without crashing", () => {
    expect(parseOverrides('{"spring-comfort-set": "garbage"}')).toEqual({});
  });

  it("drops individual checkpoint entries with the wrong shape, keeping the valid ones", () => {
    const result = parseOverrides(
      '{"spring-comfort-set": {' +
        '"info": {"completed": true, "completedAt": "2026-08-01T00:00:00.000Z"},' +
        '"pricing": "yes",' +
        '"images": null,' +
        '"shipping": {"completed": "yes", "completedAt": null},' +
        '"compliance": {"completed": true, "completedAt": 12345}' +
        "}}"
    );
    expect(result).toEqual({
      "spring-comfort-set": {
        info: { completed: true, completedAt: "2026-08-01T00:00:00.000Z" },
      },
    });
  });

  it("keeps different products' overrides independent", () => {
    const result = parseOverrides(
      '{"product-a": {"x": {"completed": true, "completedAt": null}}, ' +
        '"product-b": {"y": {"completed": false, "completedAt": null}}}'
    );
    expect(result).toEqual({
      "product-a": { x: { completed: true, completedAt: null } },
      "product-b": { y: { completed: false, completedAt: null } },
    });
  });

  it("round-trips a well-formed multi-product, multi-checkpoint payload", () => {
    const overrides = {
      "spring-comfort-set": {
        shipping: { completed: true, completedAt: "2026-08-20T09:00:00.000Z" },
        compliance: { completed: false, completedAt: null },
      },
      "luxury-sheet-set": {
        inventory: { completed: true, completedAt: "2026-08-22T14:30:00.000Z" },
      },
    };
    expect(parseOverrides(JSON.stringify(overrides))).toEqual(overrides);
  });

  // Cookies written before completedAt existed store a plain boolean per checkpoint.
  // Those must keep working, not get silently dropped — normalized to completedAt: null
  // since the real historical date was never recorded.
  it("normalizes legacy plain-boolean checkpoint values for backward compatibility", () => {
    const result = parseOverrides(
      '{"spring-comfort-set": {"shipping": true, "compliance": false}}'
    );
    expect(result).toEqual({
      "spring-comfort-set": {
        shipping: { completed: true, completedAt: null },
        compliance: { completed: false, completedAt: null },
      },
    });
  });
});

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    name: "Test Product",
    category: "Bedding",
    owner: "Test Owner",
    launchDate: "2026-01-01",
    image: "/images/products/test.jpg",
    checkpoints: [
      { id: "info", label: "Info", weight: 50, critical: false, completed: false, completedAt: null },
      {
        id: "compliance",
        label: "Compliance",
        weight: 50,
        critical: true,
        completed: false,
        completedAt: null,
      },
    ],
    ...overrides,
  };
}

describe("applyOverrides", () => {
  it("flips only the overridden checkpoint, leaving the rest at their default value", () => {
    const [result] = applyOverrides([product()], {
      p1: { info: { completed: true, completedAt: "2026-08-01T00:00:00.000Z" } },
    });
    expect(result.checkpoints.find((c) => c.id === "info")?.completed).toBe(true);
    expect(result.checkpoints.find((c) => c.id === "compliance")?.completed).toBe(false);
  });

  it("applies completedAt from the override, not just completed", () => {
    const [result] = applyOverrides([product()], {
      p1: { info: { completed: true, completedAt: "2026-08-24T10:00:00.000Z" } },
    });
    expect(result.checkpoints.find((c) => c.id === "info")?.completedAt).toBe(
      "2026-08-24T10:00:00.000Z"
    );
  });

  it("returns the same product reference when it has no override entry", () => {
    const p = product();
    const [result] = applyOverrides([p], {
      "some-other-product": { info: { completed: true, completedAt: null } },
    });
    expect(result).toBe(p);
  });

  it("ignores an override key that doesn't match any real checkpoint id", () => {
    const [result] = applyOverrides([product()], {
      p1: { "totally-fake-checkpoint": { completed: true, completedAt: null } },
    });
    expect(result.checkpoints).toHaveLength(2);
    expect(result.checkpoints.map((c) => c.completed)).toEqual([false, false]);
  });

  it("keeps two different products' overrides from cross-contaminating", () => {
    const productA = product({ id: "a" });
    const productB = product({ id: "b" });
    const [resultA, resultB] = applyOverrides([productA, productB], {
      a: { info: { completed: true, completedAt: null } },
      b: { compliance: { completed: true, completedAt: null } },
    });
    expect(resultA.checkpoints.find((c) => c.id === "info")?.completed).toBe(true);
    expect(resultA.checkpoints.find((c) => c.id === "compliance")?.completed).toBe(false);
    expect(resultB.checkpoints.find((c) => c.id === "info")?.completed).toBe(false);
    expect(resultB.checkpoints.find((c) => c.id === "compliance")?.completed).toBe(true);
  });

  it("does not mutate the input products array", () => {
    const p = product();
    const originalCompleted = p.checkpoints.map((c) => c.completed);
    applyOverrides([p], {
      p1: {
        info: { completed: true, completedAt: null },
        compliance: { completed: true, completedAt: null },
      },
    });
    expect(p.checkpoints.map((c) => c.completed)).toEqual(originalCompleted);
  });
});

describe("getStaticProduct", () => {
  it("finds a real product by id from the static catalog", () => {
    const product = getStaticProduct("spring-comfort-set");
    expect(product?.name).toBe("Spring Comfort Set");
  });

  it("returns undefined for an unknown id, without throwing", () => {
    expect(getStaticProduct("does-not-exist")).toBeUndefined();
  });

  it("is synchronous — callable with no request/cookie context at all", () => {
    // If this ever started calling cookies() internally, this assertion would need an
    // `await` and the function would need a request scope to not throw; neither is true
    // today, which is the point.
    const result = getStaticProduct("spring-comfort-set");
    expect(result).not.toBeInstanceOf(Promise);
  });
});
