import { test, expect } from "@playwright/test";

test.describe("ONB-1 step-scoped validation", () => {
  test("Next on an earlier step is not blocked by invalid fields on later steps", async ({ page }) => {
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

    // Goals: make a goal invalid (clear required name).
    await page.getByRole("button", { name: "+ Emergency fund" }).click();
    const nameInput = page.getByLabel("Name").first();
    await nameInput.fill("");

    // Navigate back to Assumptions.
    await page.getByRole("button", { name: "Back", exact: true }).click(); // Investments
    await page.getByRole("button", { name: "Back", exact: true }).click(); // Household
    await page.getByRole("button", { name: "Back", exact: true }).click(); // Members
    await page.getByRole("button", { name: "Back", exact: true }).click(); // Assumptions

    // Next should validate assumptions only and proceed.
    await page.locator('button:has-text("Next")').first().click();
    await expect(page.getByText("Household members").first()).toBeVisible();
  });
});

