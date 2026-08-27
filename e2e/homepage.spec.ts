import { test, expect } from "@playwright/test";

test("homepage loads, lists every product, and reveals category + readiness on hover", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Every launch in motion" })).toBeVisible();

  const cards = page.getByTestId("product-card");
  await expect(cards).toHaveCount(6);

  const springComfort = cards.filter({ hasText: "Spring Comfort Set" });
  await expect(springComfort).toBeVisible();
  // Only the title and date are always visible now — category moved into the hover
  // overlay alongside readiness, so it's deliberately not asserted here.
  await expect(springComfort.getByText("Spring Comfort Set")).toBeVisible();
  await expect(springComfort.getByText("Launch Sep 15")).toBeVisible();

  // Category + readiness sit in the DOM already (see components/product-card.tsx) but
  // stay transparent until hover — assert the opacity directly rather than
  // visible/hidden, since Playwright's visibility check doesn't treat opacity:0 as
  // "hidden" (the element still has layout). Risk is deliberately not shown on the card
  // at all — full risk detail lives on the product page.
  const overlay = springComfort.getByTestId("readiness-overlay");
  await expect(overlay).toHaveCSS("opacity", "0");

  await springComfort.hover();
  await expect(overlay).toHaveCSS("opacity", "1");
  await expect(springComfort.getByText("Bedding")).toBeVisible();
  await expect(springComfort.getByText("85%")).toBeVisible();
});
