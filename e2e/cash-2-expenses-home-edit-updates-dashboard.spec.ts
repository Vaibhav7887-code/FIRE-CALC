import { test, expect } from "@playwright/test";

test.describe("CASH-2 household categories post-onboarding home", () => {
  test("dashboard links to expenses home and edits update household roll-up", async ({ page }) => {
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

    // Household budget: set allocated monthly and add one category.
    await page.getByLabel("Household expenses allocated (monthly)").fill("4000");
    await page.getByRole("button", { name: "+ Add category" }).click();
    await page.getByLabel("Name").first().fill("Rent");
    await page.getByLabel("Monthly amount").first().fill("2000");
    await page.locator('button:has-text("Next")').first().click();

    // Investments, Goals, Debts, Templates, Review -> Dashboard
    await page.locator('button:has-text("Next")').first().click(); // Investments
    await page.locator('button:has-text("Next")').first().click(); // Goals
    await page.locator('button:has-text("Next")').first().click(); // Debts
    await page.locator('button:has-text("Next")').first().click(); // Templates
    await page.getByRole("button", { name: "Create dashboard" }).click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Allocation slider" })).toBeVisible();
    await expect(page.locator('[title="Household: $4000.00"]').first()).toBeVisible();

    // Deep link to expenses home.
    await page.getByRole("button", { name: "Manage household categories" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Household categories" })).toBeVisible();

    // Update allocated monthly and save.
    await page.getByLabel("Household expenses allocated (monthly)").fill("4500");
    await page.getByRole("button", { name: "Save changes" }).click();

    // Back to dashboard and verify roll-up.
    await page.getByRole("button", { name: "Back to dashboard" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator('[title="Household: $4500.00"]').first()).toBeVisible();
  });
});

