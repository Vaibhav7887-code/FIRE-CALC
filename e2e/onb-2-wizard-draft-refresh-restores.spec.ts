import { test, expect } from "@playwright/test";

test.describe("ONB-2 wizard draft persistence", () => {
  test("refresh restores step index and entered values", async ({ page }) => {
    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");

    // Clear storage once, then continue (do not clear on refresh).
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.reload();
    await page.waitForLoadState("networkidle");

    await page.getByLabel("Projection horizon (years)").fill("10");
    await page.locator('button:has-text("Next")').first().click();

    // We should be on the next step.
    await expect(page.getByRole("heading", { name: "Household members" })).toBeVisible();

    // Refresh mid-setup.
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Step index restored.
    await expect(page.getByRole("heading", { name: "Household members" })).toBeVisible();

    // Value restored.
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(page.getByLabel("Projection horizon (years)")).toHaveValue("10");
  });
});

