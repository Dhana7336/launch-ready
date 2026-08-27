import { test, expect } from "@playwright/test";

test.describe("mobile navigation drawer", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("hamburger opens the drawer; backdrop and Escape both close it", async ({ page }) => {
    await page.goto("/");

    const hamburger = page.getByRole("button", { name: "Open navigation menu" });
    await expect(hamburger).toBeVisible();

    // The drawer is positioned off-screen via a CSS transform when closed, not just
    // hidden via opacity — toBeVisible() wouldn't catch a regression here (an element
    // translated off-screen still has a bounding box and passes Playwright's visibility
    // check), so assert the actual position instead, same lesson as the card hover reveal.
    const asideLeft = () =>
      page.evaluate(
        () => Math.round(document.querySelector("aside")!.getBoundingClientRect().left)
      );

    expect(await asideLeft()).toBeLessThan(0);

    await hamburger.click();
    await expect(page.getByRole("link", { name: "Overview" })).toBeVisible();
    await expect(async () => {
      expect(await asideLeft()).toBe(0);
    }).toPass();

    await page.locator("div.bg-ink\\/50").click({ position: { x: 350, y: 400 } });
    await expect(async () => {
      expect(await asideLeft()).toBeLessThan(0);
    }).toPass();

    await hamburger.click();
    await expect(async () => {
      expect(await asideLeft()).toBe(0);
    }).toPass();
    await page.keyboard.press("Escape");
    await expect(async () => {
      expect(await asideLeft()).toBeLessThan(0);
    }).toPass();
  });

  test("clicking a nav link closes the drawer and navigates", async ({ page }) => {
    await page.goto("/products/spring-comfort-set");

    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await page.getByRole("link", { name: "Overview" }).click();

    await expect(page).toHaveURL("/");
  });
});

test("the hamburger button does not exist at desktop width", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Open navigation menu" })).toHaveCount(0);
});
