import { test, expect } from "@playwright/test";

function parseCurrencyToCents(text: string): number {
  const cleaned = text.replace(/[^0-9.-]/g, "");
  const dollars = Number(cleaned);
  if (!Number.isFinite(dollars)) return 0;
  return Math.round(dollars * 100);
}

async function getCashflowRowValueCents(page: any, label: string): Promise<number> {
  const labelNode = page.locator("p", { hasText: label }).first();
  const row = labelNode.locator("..");
  const valueText = await row.locator("p").nth(1).textContent();
  return parseCurrencyToCents(valueText ?? "");
}

function isoFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

test.describe("DEBT-2 future-start debts do not affect current-month totals", () => {
  test("wizard planned outflow ignores future-start debt; wizard + dashboard show Upcoming", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");

    // Advance to Household expenses (some flows require at least one category).
    await page.locator('button:has-text("Next")').first().click(); // Assumptions
    await page.locator('button:has-text("Next")').first().click(); // Household members

    // Household expenses: add one category so we can proceed reliably.
    await expect(page.getByRole("heading", { name: "Breakdown" })).toBeVisible();
    await page.getByRole("button", { name: "+ Add category" }).click();
    await page.getByRole("textbox", { name: "Name" }).first().fill("Rent");
    await page.getByRole("textbox", { name: "Monthly amount" }).first().fill("2000");
    await page.locator('button:has-text("Next")').first().click();

    // Investments step (skip)
    await page.locator('button:has-text("Next")').first().click();
    // Goals step (skip)
    await page.locator('button:has-text("Next")').first().click();

    // Debts step
    await expect(page.getByRole("heading", { name: "Debts" })).toBeVisible();

    const plannedOutflowBefore = await getCashflowRowValueCents(page, "Planned outflow (monthly)");
    const availableBefore = await getCashflowRowValueCents(page, "Available (net − outflow)");

    await page.getByRole("button", { name: "+ Add debt" }).click();

    // Future start date: 2 months from current month.
    const now = new Date();
    const future = new Date(now.getFullYear(), now.getMonth() + 2, 1);
    const startIso = isoFromDate(future);
    const startMonthKey = startIso.slice(0, 7);

    await page.getByLabel("Name").first().fill("Future-start debt");
    await page.getByLabel("Current balance").first().fill("10000");
    await page.getByLabel("Interest (APR %)").first().fill("5");
    await page.getByLabel("Start date (optional)").first().fill(startIso);
    await page.getByLabel("Monthly payment").first().fill("500");

    // StepDebts helper badge should appear.
    await expect(page.locator("text=/Starts\\s+/").first()).toBeVisible();

    // Planned outflow / available should not change for a future-start debt.
    const plannedOutflowAfter = await getCashflowRowValueCents(page, "Planned outflow (monthly)");
    const availableAfter = await getCashflowRowValueCents(page, "Available (net − outflow)");
    expect(plannedOutflowAfter).toBe(plannedOutflowBefore);
    expect(availableAfter).toBe(availableBefore);

    // Upcoming callout should appear with planned payment and start month.
    await expect(page.getByText("Upcoming debts")).toBeVisible();
    await expect(page.getByText("Future-start debt")).toBeVisible();
    await expect(page.getByText(`Starts ${startMonthKey}`)).toBeVisible();
    await expect(page.getByText(/Planned:\s*\$?500/)).toBeVisible();

    // Continue to dashboard.
    await page.locator('button:has-text("Next")').first().click(); // Templates
    await page.locator('button:has-text("Next")').first().click(); // Review
    await page.getByRole("button", { name: "Create dashboard" }).click();

    await expect(page).toHaveURL(/.*dashboard/);
    await page.waitForLoadState("networkidle");

    // Dashboard: upcoming debt is visible and marked, but not part of slider bar segments.
    await expect(page.getByText("Upcoming debts").first()).toBeVisible();
    await expect(page.getByText("Future-start debt").first()).toBeVisible();
    await expect(page.getByText(`Starts ${startMonthKey}`).first()).toBeVisible();
    await expect(page.getByText(/\$0 this month/i).first()).toBeVisible();
    await expect(page.getByText(/Planned\s*\$?500/).first()).toBeVisible();

    await expect(page.locator('[title*="Future-start debt:"]').first()).toHaveCount(0);
  });
});

