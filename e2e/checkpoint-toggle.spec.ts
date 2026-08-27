import { test, expect } from "@playwright/test";
import { formatCompletedDate } from "../lib/format-date";

test("marking an incomplete checkpoint complete shows a pending state, then recomputes readiness and risk", async ({
  page,
}) => {
  await page.goto("/products/classic-cotton-collection");

  await expect(page.getByTestId("readiness-value")).toHaveText("70%");
  await expect(page.getByTestId("risk-value")).toHaveText("Medium Risk");

  const row = page.locator("li", { hasText: "Product images approved" });
  const button = row.getByRole("button");
  const completedAt = row.getByTestId("checkpoint-completed-at");
  await expect(button).toHaveText("Pending");
  await expect(completedAt).toHaveText("—");

  // Slow the server action's response slightly so the pending state is actually
  // observable instead of racing past it in a single tick on localhost.
  await page.route("**/products/classic-cotton-collection", async (route) => {
    if (route.request().method() === "POST") {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    await route.continue();
  });

  const beforeClick = new Date();
  await button.click();
  await expect(button).toHaveText("Saving…");
  await expect(button).toBeDisabled();
  // Still pending mid-flight — completedAt shouldn't jump ahead of the server response.
  await expect(completedAt).toHaveText("—");

  await expect(button).toHaveText("Completed", { timeout: 5000 });
  await expect(page.getByTestId("readiness-value")).toHaveText("85%");
  await expect(page.getByTestId("risk-value")).toHaveText("Low Risk");
  // completedAt is set server-side to the moment of completion, not a fixed seed date —
  // today's date either side of the click is the only thing a test can assert exactly.
  await expect(completedAt).toHaveText(formatCompletedDate(beforeClick.toISOString()));

  // Reopening clears it back to "—", not a stale leftover date.
  await button.click();
  await expect(button).toHaveText("Pending", { timeout: 5000 });
  await expect(completedAt).toHaveText("—");
});

test("a reload preserves the toggled checkpoint state", async ({ page }) => {
  await page.goto("/products/spring-comfort-set");

  const row = page.locator("li", { hasText: "Shipping configured" });
  const button = row.getByRole("button");
  await expect(button).toHaveText("Pending");

  await button.click();
  await expect(button).toHaveText("Completed", { timeout: 5000 });
  await expect(page.getByTestId("readiness-value")).toHaveText("100%");

  const completedAtText = await row.getByTestId("checkpoint-completed-at").innerText();
  expect(completedAtText).not.toBe("—");

  await page.reload();

  await expect(row.getByRole("button")).toHaveText("Completed");
  await expect(page.getByTestId("readiness-value")).toHaveText("100%");
  // Not just completed, but the same completedAt — proves the cookie round-tripped the
  // actual timestamp, not just the boolean.
  await expect(row.getByTestId("checkpoint-completed-at")).toHaveText(completedAtText);
});
