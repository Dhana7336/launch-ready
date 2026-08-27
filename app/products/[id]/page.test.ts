import { describe, expect, it } from "vitest";
import { generateMetadata } from "./page";

// generateMetadata is deliberately callable with no request/cookie context — it only
// touches getStaticProduct (lib/products.ts), never getProduct/readOverrides. If it ever
// started depending on session state, this test would need to fake a request scope (the
// same way tests would break if lib/products.ts's cookie-aware functions were called
// outside a request — see lib/products.test.ts for that boundary).
describe("generateMetadata", () => {
  it("titles a known product with just its name (the root layout template adds the suffix)", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ id: "premium-quilt-collection" }),
    });

    expect(metadata.title).toBe("Premium Quilt Collection");
    expect(metadata.description).toContain("Premium Quilt Collection");
  });

  it("falls back to a sensible title for an unknown product id", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ id: "does-not-exist" }),
    });

    expect(metadata.title).toBe("Product Not Found");
    expect(metadata.description).toBeUndefined();
  });
});
