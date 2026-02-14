import { test, expect } from "@playwright/test";

test.describe("PROJ-1 recurring toggle consistency", () => {
  test("non-recurring investment does not count as monthly allocation", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");

    // Assumptions
    await page.locator('button:has-text("Next")').first().click();
    // Household members
    await page.locator('button:has-text("Next")').first().click();

    // Household expenses: add one category to proceed reliably.
    await page.getByRole("button", { name: "+ Add category" }).click();
    await page.getByRole("textbox", { name: "Name" }).first().fill("Rent");
    await page.getByRole("textbox", { name: "Monthly amount" }).first().fill("2000");
    await page.locator('button:has-text("Next")').first().click();

    // Investments: add a custom bucket with monthly contribution but recurring OFF.
    await page.getByLabel("Type").selectOption("Custom");
    await page.locator('button:has-text("+ Add")').first().click();

    const bucketCard = page.locator('div[class*="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"]').filter({
      hasText: "Bucket name",
    }).first();

    await bucketCard.getByLabel("Bucket name").fill("Paused investment");
    await bucketCard.locator('input[id$=".monthlyContribution"]').fill("1000");
    await bucketCard.locator('input[type="checkbox"][id$=".isRecurringMonthly"]').uncheck();

    // Goals, Debts, Templates, Review -> Dashboard
    await page.locator('button:has-text("Next")').first().click(); // Goals
    await page.locator('button:has-text("Next")').first().click(); // Debts
    await page.locator('button:has-text("Next")').first().click(); // Templates
    await page.locator('button:has-text("Next")').first().click(); // Review
    await page.getByRole("button", { name: "Create dashboard" }).click();

    await expect(page).toHaveURL(/.*dashboard/);
    await page.waitForLoadState("networkidle");

    // Allocation is a monthly view: paused (non-recurring) investments must not count as $/mo.
    await expect(page.getByText("Paused investment").first()).toHaveCount(0);
    await expect(page.getByText("Paused investment: $1000.00").first()).toHaveCount(0);
  });
});

