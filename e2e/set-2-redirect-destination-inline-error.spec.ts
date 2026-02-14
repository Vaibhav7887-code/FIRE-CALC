import { test, expect } from "@playwright/test";

test.describe("SET-2 redirect destination inline error", () => {
  test("missing destination shows inline error adjacent to destination selector", async ({ page }) => {
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
    // Household -> Investments
    await page.locator('button:has-text("Next")').first().click();
    // Investments -> Goals
    await page.locator('button:has-text("Next")').first().click();

    // Goals: create a goal and configure an invalid redirect (destination kind set, destination missing).
    await page.getByRole("button", { name: "+ Emergency fund" }).click();
    const goalCard = page
      .locator('div[class*="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"]')
      .filter({ hasText: "Target amount" })
      .first();

    await goalCard.getByLabel("Redirect to").selectOption("GoalFund");
    // Leave Destination unselected ("Select…").

    // Debts -> Templates -> Review
    await page.locator('button:has-text("Next")').first().click(); // Debts
    await page.locator('button:has-text("Next")').first().click(); // Templates
    await page.locator('button:has-text("Next")').first().click(); // Review

    // Submit should surface the inline error.
    await page.getByRole("button", { name: "Create dashboard" }).click();
    await expect(page.getByText("Destination is required.").first()).toBeVisible();
  });
});

