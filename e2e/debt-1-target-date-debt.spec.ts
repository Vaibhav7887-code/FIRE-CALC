import { test, expect } from "@playwright/test";

function parseCurrencyToCents(text: string): number {
  // Handles strings like "$1,234.56" or "-$123.45"
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

test.describe("DEBT-1 target-date debt is included in outflow/allocation", () => {
  test("wizard planned outflow and dashboard debt segment include implied payment", async ({ page }) => {
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

    await page.getByRole("button", { name: "+ Add debt" }).click();

    // Fill debt card (first debt).
    await page.getByLabel("Name").first().fill("Target-date debt");
    await page.getByLabel("Current balance").first().fill("1200");
    await page.getByLabel("Interest (APR %)").first().fill("0");

    // Use current month for stability across calendar time.
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const startIso = `${y}-${m}-01`;
    await page.getByLabel("Start date (optional)").first().fill(startIso);

    // Select target-date payoff plan.
    await page.getByLabel("Payoff plan").first().selectOption("targetDate");
    const targetIso = `${y + 1}-${m}-01`;
    await page.getByLabel("Target payoff date").first().fill(targetIso);

    await expect(page.locator("text=Implied monthly payment:")).toBeVisible();

    const plannedOutflowAfter = await getCashflowRowValueCents(page, "Planned outflow (monthly)");
    expect(plannedOutflowAfter - plannedOutflowBefore).toBeGreaterThanOrEqual(100_00);

    // Continue to dashboard.
    await page.locator('button:has-text("Next")').first().click(); // Templates
    await page.locator('button:has-text("Next")').first().click(); // Review
    await page.getByRole("button", { name: "Create dashboard" }).click();

    await expect(page).toHaveURL(/.*dashboard/);
    await page.waitForLoadState("networkidle");

    // Verify debt segment appears with non-zero dollars.
    await expect(page.getByText("Target-date debt").first()).toBeVisible();
    const debtChip = page.locator("div", { hasText: "Target-date debt" }).first();
    await expect(debtChip).toContainText("$100");

    // Verify at least one fixed boundary exists (locked handle adjacent to the target-date debt segment).
    await expect(page.locator('[title="Fixed boundary"]').first()).toBeVisible();
  });
});

