import { test, expect } from "@playwright/test";

test.describe("PROJ-3 shortfall display", () => {
  test("dashboard shows numeric shortfall when over-allocated", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");

    // Assumptions -> Members
    await page.locator('button:has-text("Next")').first().click();
    // Members -> Household
    await page.locator('button:has-text("Next")').first().click();

    // Household: force over-allocation.
    await page.getByLabel("Household expenses allocated (monthly)").fill("10000");
    await page.locator('button:has-text("Next")').first().click();

    // Investments -> Goals -> Debts -> Templates -> Review (Create dashboard)
    await page.locator('button:has-text("Next")').first().click(); // Investments
    await page.locator('button:has-text("Next")').first().click(); // Goals
    await page.locator('button:has-text("Next")').first().click(); // Debts
    await page.locator('button:has-text("Next")').first().click(); // Templates

    await page.getByRole("button", { name: "Create dashboard" }).click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/Shortfall:/).first()).toBeVisible();
    await expect(page.getByText(/\$.*\/mo/).first()).toBeVisible();
  });
});

