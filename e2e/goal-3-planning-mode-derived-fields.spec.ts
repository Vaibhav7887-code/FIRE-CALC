import { test, expect, type Page } from "@playwright/test";

async function navigateToGoalsStep(page: Page) {
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
  await expect(page.getByRole("button", { name: "+ Emergency fund" })).toBeVisible();
}

test.describe("GOAL-3 planning mode + derived fields", () => {
  test("monthly mode: monthly editable, target date derived/read-only and updates from monthly", async ({ page }) => {
    await navigateToGoalsStep(page);

    await page.getByRole("button", { name: "+ Custom goal" }).click();

    const goal = page
      .locator('div[class*="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"]')
      .filter({ hasText: "Planning mode" })
      .first();

    await goal.getByLabel("Name").fill("Goal 3");
    await goal.getByLabel("Planning mode").selectOption("monthlyContribution");

    await goal.getByLabel("Start date (optional)").fill("2026-01-01");
    await goal.getByLabel("Current balance").fill("0");
    await goal.getByLabel("Target amount").fill("1200");

    const monthly = goal.getByLabel(/Monthly contribution/);
    const targetDate = goal.getByLabel(/Target date/);

    await expect(monthly).not.toHaveAttribute("readonly");
    await expect(targetDate).toHaveJSProperty("readOnly", true);
    await expect(goal.getByText("Derived").first()).toBeVisible();
    await expect(goal.getByText("Derived from your planning mode. Switch planning mode to edit.")).toBeVisible();

    await monthly.fill("100");
    await expect(targetDate).toHaveValue("2027-01-01");

    await monthly.fill("200");
    await expect(targetDate).toHaveValue("2026-07-01");
  });

  test("target-date mode: target date editable, monthly derived/read-only and updates from target date", async ({ page }) => {
    await navigateToGoalsStep(page);

    await page.getByRole("button", { name: "+ Custom goal" }).click();

    const goal = page
      .locator('div[class*="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"]')
      .filter({ hasText: "Planning mode" })
      .first();

    await goal.getByLabel("Name").fill("Goal 3");
    await goal.getByLabel("Start date (optional)").fill("2026-01-01");
    await goal.getByLabel("Current balance").fill("0");
    await goal.getByLabel("Target amount").fill("1200");

    await goal.getByLabel("Planning mode").selectOption("targetDate");

    const monthly = goal.getByLabel(/Monthly contribution/);
    const targetDate = goal.getByLabel(/Target date/);

    await expect(targetDate).not.toHaveAttribute("readonly");
    await expect(monthly).toHaveJSProperty("readOnly", true);
    await expect(goal.getByText("Derived").first()).toBeVisible();
    await expect(goal.getByText("Derived from your planning mode. Switch planning mode to edit.")).toBeVisible();

    await targetDate.fill("2026-07-01");
    await expect(monthly).toHaveValue("200.00");
  });

  test('clearing target date in target-date mode blocks Next and shows "Target date is required."', async ({ page }) => {
    await navigateToGoalsStep(page);

    await page.getByRole("button", { name: "+ Custom goal" }).click();

    const goal = page
      .locator('div[class*="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"]')
      .filter({ hasText: "Planning mode" })
      .first();

    await goal.getByLabel("Name").fill("Goal 3");
    await goal.getByLabel("Planning mode").selectOption("targetDate");

    await goal.getByLabel(/Target date/).fill("");

    await page.locator('button:has-text("Next")').first().click();
    await expect(page.getByText("Target date is required.")).toBeVisible();
    await expect(page.getByRole("button", { name: "+ Emergency fund" })).toBeVisible();
  });
});

