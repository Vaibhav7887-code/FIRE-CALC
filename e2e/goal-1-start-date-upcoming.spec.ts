import { test, expect } from "@playwright/test";

test.describe("GOAL-1 goal start date respected in dashboard projections", () => {
  test("future-start goal shows as upcoming and contributes $0 until start", async ({ page }) => {
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

    // Investments (skip)
    await page.locator('button:has-text("Next")').first().click();

    // Goals
    await page.getByRole("button", { name: "+ Custom goal" }).click();
    await page.getByLabel("Name").first().fill("Future goal");
    await page.getByLabel("Start date (optional)").first().fill("2030-01-01");
    await page.getByLabel("Monthly contribution").first().fill("500");
    await page.locator('button:has-text("Next")').first().click();

    // Debts (skip)
    await page.locator('button:has-text("Next")').first().click();
    // Templates (skip)
    await page.locator('button:has-text("Next")').first().click();

    // Review → dashboard
    await Promise.all([
      page.waitForURL(/.*dashboard/),
      page.locator("form").first().evaluate((f: any) => {
        if (typeof f?.requestSubmit === "function") f.requestSubmit();
        else f?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      }),
    ]);
    await expect(page).toHaveURL(/.*dashboard/);
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Upcoming goals")).toBeVisible();
    await expect(page.getByText("Future goal").first()).toBeVisible();
    await expect(page.getByText(/Starts 2030-01/)).toBeVisible();
    await expect(page.getByText(/contribute \$0/i).first()).toBeVisible();
  });
});

