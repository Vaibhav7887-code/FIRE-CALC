import { test, expect } from "@playwright/test";

test.describe("SET-1 assumptions home", () => {
  test("user can edit assumptions post-onboarding and dashboard reflects them", async ({ page }) => {
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
    // Goals -> Debts
    await page.locator('button:has-text("Next")').first().click();
    // Debts -> Templates
    await page.locator('button:has-text("Next")').first().click();
    // Templates -> Review (Create dashboard)
    await page.locator('button:has-text("Next")').first().click();

    await Promise.all([
      page.waitForURL(/.*dashboard/),
      page.locator("form").first().evaluate((f: any) => {
        if (typeof f?.requestSubmit === "function") f.requestSubmit();
        else f?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      }),
    ]);
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/horizon\s+30y/i).first()).toBeVisible();
    await page.getByRole("button", { name: "Edit" }).first().click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Assumptions" })).toBeVisible();
    await page.getByLabel("Projection horizon (years)").fill("10");
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.getByRole("button", { name: "Back to dashboard" }).click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/horizon\s+10y/i).first()).toBeVisible();
  });
});

