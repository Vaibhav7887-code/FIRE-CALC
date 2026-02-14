import { test, expect } from "@playwright/test";

test.describe("SET-3 registered ceiling source labels", () => {
  test("review step shows unambiguous labels for TFSA/RRSP ceiling sources", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");

    // Navigate to Review.
    await page.locator('button:has-text("Next")').first().click(); // Assumptions
    await page.locator('button:has-text("Next")').first().click(); // Members
    await page.locator('button:has-text("Next")').first().click(); // Household
    await page.locator('button:has-text("Next")').first().click(); // Investments
    await page.locator('button:has-text("Next")').first().click(); // Goals
    await page.locator('button:has-text("Next")').first().click(); // Debts
    await page.locator('button:has-text("Next")').first().click(); // Templates

    await expect(page.getByText("Ceiling redirect rules").first()).toBeVisible();

    await expect(page.getByText(/When TFSA.*ceiling completes/i).first()).toBeVisible();
    await expect(page.getByText(/When RRSP.*ceiling completes/i).first()).toBeVisible();
    await expect(page.getByText("When Ceiling completes").first()).toHaveCount(0);
  });
});

