import { test, expect } from "@playwright/test";

test.describe("GOAL-2 redirect rules accelerate downstream goals", () => {
  test("dashboard shows goal redirect impact and trace for goal destination", async ({ page }) => {
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
    await page.getByRole("button", { name: "+ Vacation" }).click();
    await page.getByRole("button", { name: "+ Emergency fund" }).click();

    const goalCards = page
      .locator('div[class*="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"]')
      .filter({ hasText: "Target amount" });
    const goalA = goalCards.first();
    const goalB = goalCards.nth(1);

    await goalA.getByLabel("Name").fill("Goal A");
    await goalA.getByLabel("Target amount").fill("500");
    await goalA.getByLabel("Monthly contribution").fill("500");

    await goalB.getByLabel("Name").fill("Goal B");
    await goalB.getByLabel("Target amount").fill("2000");
    await goalB.getByLabel("Monthly contribution").fill("0");

    // Configure redirect: when Goal A completes, redirect to Goal B.
    await goalA.getByLabel("Redirect to").selectOption("GoalFund");
    await goalA.getByLabel("Destination").selectOption({ label: "Goal B" });

    // Debts, Templates, Review -> Dashboard
    await page.locator('button:has-text("Next")').first().click(); // Debts
    await page.locator('button:has-text("Next")').first().click(); // Templates
    await page.locator('button:has-text("Next")').first().click(); // Review
    await page.getByRole("button", { name: "Create dashboard" }).click();

    await expect(page).toHaveURL(/.*dashboard/);
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("goal-redirect-impact-panel")).toBeVisible();
    const goalBCard = page
      .locator('[data-testid^="goal-redirect-impact-"]:not([data-testid="goal-redirect-impact-panel"])')
      .filter({ hasText: "Goal B" })
      .first();
    await expect(goalBCard).toBeVisible();

    await goalBCard.getByTestId("goal-redirect-trace").locator("summary").click();
    await expect(goalBCard.getByTestId("goal-redirect-trace-item").first()).toBeVisible();
    await expect(goalBCard.getByText(/Goal: Goal A/).first()).toBeVisible();
  });
});

