import { test, expect } from "@playwright/test";

test.describe("ONB-3 returning user entrypoint", () => {
  test("root route offers explicit choice when a saved dashboard session exists", async ({ page }) => {
    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Create a dashboard session.
    await page.locator('button:has-text("Next")').first().click(); // Assumptions
    await page.locator('button:has-text("Next")').first().click(); // Members
    await page.locator('button:has-text("Next")').first().click(); // Household
    await page.locator('button:has-text("Next")').first().click(); // Investments
    await page.locator('button:has-text("Next")').first().click(); // Goals
    await page.locator('button:has-text("Next")').first().click(); // Debts
    await page.locator('button:has-text("Next")').first().click(); // Templates
    await page.getByRole("button", { name: "Create dashboard" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    const flag = await page.evaluate(() => window.localStorage.getItem("budgeting.dashboard.created.v1"));
    expect(flag).toBe("true");

    // Returning to root should show the explicit choice.
    await page.goto("http://localhost:3000/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("You have an existing plan").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Go to dashboard" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Start a new plan" })).toBeVisible();
  });
});

