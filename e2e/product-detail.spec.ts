import { test, expect } from "@playwright/test";

test("clicking a product from the homepage opens its detail page", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("product-card").filter({ hasText: "Luxury Sheet Set" }).click();

  await expect(page).toHaveURL("/products/luxury-sheet-set");
  await expect(page).toHaveTitle("Luxury Sheet Set | LaunchReady");
  await expect(page.getByRole("heading", { name: "Luxury Sheet Set", level: 1 })).toBeVisible();
  await expect(page.getByText("Priya Nair")).toBeVisible();
  await expect(page.getByTestId("readiness-value")).toHaveText("45%");
  await expect(page.getByTestId("risk-value")).toHaveText("High Risk");
});

test("an unknown product id renders the themed 404, not a generic error page", async ({
  page,
}) => {
  const response = await page.goto("/products/this-product-does-not-exist");

  expect(response?.status()).toBe(404);
  // Guards a real gap unit tests can't see: when the page component calls notFound(),
  // Next resolves metadata from the not-found.tsx segment, not generateMetadata()'s
  // return value for the failed render — so this title comes from a *separate* metadata
  // export in not-found.tsx, not the one covered by app/products/[id]/page.test.ts.
  await expect(page).toHaveTitle("Product Not Found | LaunchReady");
  await expect(page.getByRole("heading", { name: "Product not found" })).toBeVisible();
  await expect(page.getByText("We couldn't find a product with that ID.")).toBeVisible();

  // Rendered inside the app shell (root layout), not a bare Next.js error page. Scoped to
  // <aside> specifically — components/sidebar.tsx also renders "LaunchReady" in its
  // mobile top bar (a sibling, always in the DOM, just CSS-hidden at this viewport), so
  // an unscoped getByText would be ambiguous.
  await expect(page.getByRole("link", { name: "Overview" })).toBeVisible();
  await expect(page.locator("aside").getByText("LaunchReady")).toBeVisible();
});
