import { describe, expect, it } from "vitest";
import type { Product } from "@/types/product";
import { ALL_CATEGORIES, getCategoryOptions, resolveCategory } from "./category";

function product(category: string): Product {
  return {
    id: category.toLowerCase(),
    name: category,
    category,
    owner: "Test Owner",
    launchDate: "2026-01-01",
    image: "/images/products/test.jpg",
    checkpoints: [],
  };
}

describe("getCategoryOptions", () => {
  it("returns each category once, in first-appearance order", () => {
    const products = [product("Bedding"), product("Kids"), product("Bedding"), product("Bath")];
    expect(getCategoryOptions(products)).toEqual(["Bedding", "Kids", "Bath"]);
  });

  it("returns an empty array for an empty product list", () => {
    expect(getCategoryOptions([])).toEqual([]);
  });
});

describe("resolveCategory", () => {
  const categories = ["Bedding", "Kids", "Bath"];

  it("returns the requested category when it's in the whitelist", () => {
    expect(resolveCategory(categories, "Kids")).toBe("Kids");
  });

  it("falls back to ALL_CATEGORIES when no category was requested", () => {
    expect(resolveCategory(categories, undefined)).toBe(ALL_CATEGORIES);
  });

  it("falls back to ALL_CATEGORIES for an unrecognized value rather than throwing", () => {
    expect(resolveCategory(categories, "Furniture")).toBe(ALL_CATEGORIES);
    expect(resolveCategory(categories, "")).toBe(ALL_CATEGORIES);
    expect(resolveCategory(categories, "<script>alert(1)</script>")).toBe(ALL_CATEGORIES);
  });
});
