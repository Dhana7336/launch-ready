import { test, expect } from "@playwright/test";

test("marking an incomplete checkpoint complete shows a pending state, then recomputes readiness and risk", async ({
  page,
}) => {
  await page.goto("/products/classic-cotton-collection");

  await expect(page.getByTestId("readiness-value")).toHaveText("70%");
  await expect(page.getByTestId("risk-value")).toHaveText("Medium Risk");

  const row = page.locator("li", { hasText: "Product images approved" });
  const button = row.getByRole("button");
  await expect(button).toHaveText("Pending");

  // Slow the server action's response slightly so the pending state is actually
  // observable instead of racing past it in a single tick on localhost.
  await page.route("**/products/classic-cotton-collection", async (route) => {
    if (route.request().method() === "POST") {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    await route.continue();
  });

  await button.click();
  await expect(button).toHaveText("Saving…");
  await expect(button).toBeDisabled();

  await expect(button).toHaveText("Completed", { timeout: 5000 });
  await expect(page.getByTestId("readiness-value")).toHaveText("85%");
  await expect(page.getByTestId("risk-value")).toHaveText("Low Risk");
});

test("a reload preserves the toggled checkpoint state", async ({ page }) => {
  await page.goto("/products/spring-comfort-set");

  const row = page.locator("li", { hasText: "Shipping configured" });
  const button = row.getByRole("button");
  await expect(button).toHaveText("Pending");

  await button.click();
  await expect(button).toHaveText("Completed", { timeout: 5000 });
  await expect(page.getByTestId("readiness-value")).toHaveText("100%");

  await page.reload();

  await expect(row.getByRole("button")).toHaveText("Completed");
  await expect(page.getByTestId("readiness-value")).toHaveText("100%");
});
