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

  it("drops individual checkpoint entries that aren't booleans, keeping the valid ones", () => {
    const result = parseOverrides(
      '{"spring-comfort-set": {"info": true, "pricing": "yes", "images": null}}'
    );
    expect(result).toEqual({ "spring-comfort-set": { info: true } });
  });

  it("keeps different products' overrides independent", () => {
    const result = parseOverrides(
      '{"product-a": {"x": true}, "product-b": {"y": false}}'
    );
    expect(result).toEqual({
      "product-a": { x: true },
      "product-b": { y: false },
    });
  });

  it("round-trips a well-formed multi-product, multi-checkpoint payload", () => {
    const overrides = {
      "spring-comfort-set": { shipping: true, compliance: false },
      "luxury-sheet-set": { inventory: true },
    };
    expect(parseOverrides(JSON.stringify(overrides))).toEqual(overrides);
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
      { id: "info", label: "Info", weight: 50, critical: false, completed: false },
      { id: "compliance", label: "Compliance", weight: 50, critical: true, completed: false },
    ],
    ...overrides,
  };
}

describe("applyOverrides", () => {
  it("flips only the overridden checkpoint, leaving the rest at their default value", () => {
    const [result] = applyOverrides([product()], { p1: { info: true } });
    expect(result.checkpoints.find((c) => c.id === "info")?.completed).toBe(true);
    expect(result.checkpoints.find((c) => c.id === "compliance")?.completed).toBe(false);
  });

  it("returns the same product reference when it has no override entry", () => {
    const p = product();
    const [result] = applyOverrides([p], { "some-other-product": { info: true } });
    expect(result).toBe(p);
  });

  it("ignores an override key that doesn't match any real checkpoint id", () => {
    const [result] = applyOverrides([product()], {
      p1: { "totally-fake-checkpoint": true },
    });
    expect(result.checkpoints).toHaveLength(2);
    expect(result.checkpoints.map((c) => c.completed)).toEqual([false, false]);
  });

  it("keeps two different products' overrides from cross-contaminating", () => {
    const productA = product({ id: "a" });
    const productB = product({ id: "b" });
    const [resultA, resultB] = applyOverrides([productA, productB], {
      a: { info: true },
      b: { compliance: true },
    });
    expect(resultA.checkpoints.find((c) => c.id === "info")?.completed).toBe(true);
    expect(resultA.checkpoints.find((c) => c.id === "compliance")?.completed).toBe(false);
    expect(resultB.checkpoints.find((c) => c.id === "info")?.completed).toBe(false);
    expect(resultB.checkpoints.find((c) => c.id === "compliance")?.completed).toBe(true);
  });

  it("does not mutate the input products array", () => {
    const p = product();
    const originalCompleted = p.checkpoints.map((c) => c.completed);
    applyOverrides([p], { p1: { info: true, compliance: true } });
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
