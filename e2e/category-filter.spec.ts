import { test, expect } from "@playwright/test";

test("loading a category URL directly filters server-side, no client interaction needed", async ({
  page,
}) => {
  await page.goto("/?category=Bedding");

  const cards = page.getByTestId("product-card");
  await expect(cards).toHaveCount(4);
  await expect(cards.filter({ hasText: "Kids Bedding Collection" })).toHaveCount(0);
  await expect(cards.filter({ hasText: "Essential Bath Set" })).toHaveCount(0);

  await expect(page.getByLabel("Filter by category")).toHaveValue("Bedding");
});

test("an unrecognized category in the URL safely falls back to All", async ({ page }) => {
  await page.goto("/?category=Furniture");

  await expect(page.getByTestId("product-card")).toHaveCount(6);
  await expect(page.getByLabel("Filter by category")).toHaveValue("all");
});

test("changing category preserves unrelated params and removes the param for All", async ({
  page,
}) => {
  await page.goto("/?foo=bar");

  const select = page.getByLabel("Filter by category");
  await select.selectOption("Kids");
  await expect(page).toHaveURL(/[?&]category=Kids/);
  await expect(page).toHaveURL(/[?&]foo=bar/);

  await select.selectOption({ label: "All categories" });
  await expect(page).toHaveURL("/?foo=bar");
});

test("changing category does not scroll the page back to the top", async ({ page }) => {
  await page.goto("/");
  await page.locator("text=Every launch in motion").scrollIntoViewIfNeeded();
  const scrollBefore = await page.evaluate(() => window.scrollY);

  await page.getByLabel("Filter by category").selectOption("Kids");
  await page.waitForLoadState("networkidle");

  const scrollAfter = await page.evaluate(() => window.scrollY);
  expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThan(50);
});

test("category changes participate in browser back/forward history", async ({ page }) => {
  await page.goto("/");
  const select = page.getByLabel("Filter by category");
  const cards = page.getByTestId("product-card");

  await select.selectOption("Kids");
  await expect(page).toHaveURL(/category=Kids/);
  await expect(cards).toHaveCount(1);

  await select.selectOption("Bath");
  await expect(page).toHaveURL(/category=Bath/);
  await expect(cards).toHaveCount(1);

  await page.goBack();
  await expect(page).toHaveURL(/category=Kids/);
  await expect(cards).toHaveCount(1);
  await expect(select).toHaveValue("Kids");

  await page.goBack();
  await expect(page).toHaveURL("/");
  await expect(cards).toHaveCount(6);
  await expect(select).toHaveValue("all");

  await page.goForward();
  await expect(page).toHaveURL(/category=Kids/);
  await expect(cards).toHaveCount(1);
  await expect(select).toHaveValue("Kids");
});
