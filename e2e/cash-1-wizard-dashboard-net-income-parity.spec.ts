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

test.describe("CASH-1 wizard net income matches dashboard (RRSP room + RRSP contrib)", () => {
  test("wizard preview equals dashboard net monthly (±$1)", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");

    // Assumptions
    await page.locator('button:has-text("Next")').first().click();

    // Household members
    await page.getByLabel("Employment income (annual gross)").first().fill("100000");
    await page.getByLabel("RRSP contribution room (annual)").first().fill("20000");
    await page.locator('button:has-text("Next")').first().click();

    // Household expenses: add one category so we can proceed reliably.
    await page.getByRole("button", { name: "+ Add category" }).click();
    await page.getByRole("textbox", { name: "Name" }).first().fill("Rent");
    await page.getByRole("textbox", { name: "Monthly amount" }).first().fill("2000");
    await page.locator('button:has-text("Next")').first().click();

    // Investments: add RRSP bucket and set contribution.
    await page.locator("select#newInvestmentKind").selectOption("RRSP");
    await page.locator('button:has-text("+ Add")').first().click();
    await page.getByLabel("Monthly contribution").first().fill("1000");
    await page.locator('button:has-text("Next")').first().click();

    // Goals (skip)
    await page.locator('button:has-text("Next")').first().click();
    // Debts (skip)
    await page.locator('button:has-text("Next")').first().click();
    // Templates (skip)
    await page.locator('button:has-text("Next")').first().click();

    // Review: record wizard net income estimate.
    const wizardNetMonthlyCents = await getCashflowRowValueCents(page, "Net income (estimated, monthly)");

    await page.getByRole("button", { name: "Create dashboard" }).click();
    await expect(page).toHaveURL(/.*dashboard/);
    await page.waitForLoadState("networkidle");

    // Dashboard header: "Net income (estimated): $X/mo"
    const headerText = (await page.getByText("Net income (estimated):").locator("..").textContent()) ?? "";
    const match = headerText.match(/\$[0-9,]+\.[0-9]{2}\/mo/);
    const dashboardNetMonthlyCents = parseCurrencyToCents(match?.[0] ?? "");

    expect(Math.abs(dashboardNetMonthlyCents - wizardNetMonthlyCents)).toBeLessThanOrEqual(100);
  });
});

