import { test, expect } from "@playwright/test";

test.describe("SET-4 data home moves ops off dashboard", () => {
  test("dashboard has only a deep link; data page contains import/export and resets", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");

    // Create dashboard.
    await page.locator('button:has-text("Next")').first().click(); // Assumptions
    await page.locator('button:has-text("Next")').first().click(); // Members
    await page.locator('button:has-text("Next")').first().click(); // Household
    await page.locator('button:has-text("Next")').first().click(); // Investments
    await page.locator('button:has-text("Next")').first().click(); // Goals
    await page.locator('button:has-text("Next")').first().click(); // Debts
    await page.locator('button:has-text("Next")').first().click(); // Templates
    await Promise.all([
      page.waitForURL(/.*dashboard/),
      page.locator("form").first().evaluate((f: any) => {
        if (typeof f?.requestSubmit === "function") f.requestSubmit();
        else f?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      }),
    ]);
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Data" })).toBeVisible();

    // Ops controls removed from dashboard.
    await expect(page.getByRole("button", { name: "Export JSON" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Import JSON" })).toHaveCount(0);
    await expect(page.getByText("Reset to entered values").first()).toHaveCount(0);
    await expect(page.getByText("Start from scratch").first()).toHaveCount(0);

    // Data page contains them.
    await page.getByRole("button", { name: "Data" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Data" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Export JSON" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Import JSON" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset to entered values" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Start from scratch" })).toBeVisible();
  });
});

