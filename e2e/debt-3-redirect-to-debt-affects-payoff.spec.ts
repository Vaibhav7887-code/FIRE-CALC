import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

function isoFromCurrentMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

test.describe("DEBT-3 redirect rules to debts affect payoff projections", () => {
  test("dashboard shows payoff impact and redirect trace for a debt destination", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");

    // Advance to Household expenses (some flows require at least one category).
    await page.locator('button:has-text("Next")').first().click(); // Assumptions
    await page.locator('button:has-text("Next")').first().click(); // Household members

    await expect(page.getByRole("heading", { name: "Breakdown" })).toBeVisible();
    await page.getByRole("button", { name: "+ Add category" }).click();
    await page.getByRole("textbox", { name: "Name" }).first().fill("Rent");
    await page.getByRole("textbox", { name: "Monthly amount" }).first().fill("2000");
    await page.locator('button:has-text("Next")').first().click();

    // Investments step (skip)
    await page.locator('button:has-text("Next")').first().click();

    // Goals step: add a goal that completes quickly.
    await expect(page.getByRole("button", { name: "+ Emergency fund" })).toBeVisible();
    await page.getByRole("button", { name: "+ Emergency fund" }).click();

    await page.getByLabel("Name").first().fill("Quick goal");
    await page.getByLabel("Target amount").first().fill("500");
    await page.getByLabel("Monthly contribution").first().fill("500");
    await page.getByLabel("Return (% annual)").first().fill("0");

    await page.locator('button:has-text("Next")').first().click();

    // Debts step: add a debt.
    await expect(page.getByRole("heading", { name: "Debts" })).toBeVisible();
    await page.getByRole("button", { name: "+ Add debt" }).click();

    await page.getByLabel("Name").first().fill("Debt B");
    await page.getByLabel("Current balance").first().fill("1000");
    await page.getByLabel("Interest (APR %)").first().fill("0");
    await page.getByLabel("Start date (optional)").first().fill(isoFromCurrentMonth());
    await page.getByLabel("Monthly payment").first().fill("100");

    // Go back to Goals to configure redirect (debt options now exist).
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByRole("button", { name: "+ Emergency fund" })).toBeVisible();

    await expect(page.getByLabel("Name").first()).toHaveValue("Quick goal");
    await page.getByLabel("Redirect to").first().selectOption("DebtLoan");
    await page.getByLabel("Destination").first().selectOption({ label: "Debt B" });

    // Forward again to Review.
    await page.locator('button:has-text("Next")').first().click(); // Debts
    await expect(page.getByRole("heading", { name: "Debts" })).toBeVisible();
    await page.locator('button:has-text("Next")').first().click(); // Templates
    await page.locator('button:has-text("Next")').first().click(); // Review

    // Review step.
    await expect(page.getByText("Ceiling redirect rules")).toBeVisible();
    const quickGoalRules = page.locator("p", { hasText: "When Quick goal completes" });
    await expect(quickGoalRules.first()).toBeVisible();
    const ruleCard = quickGoalRules.first().locator("..");
    await ruleCard.getByLabel("Redirect to").selectOption("DebtLoan");
    await ruleCard.getByLabel("Destination").selectOption({ label: "Debt B" });
    await expect(ruleCard.getByLabel("Redirect to")).toHaveValue("DebtLoan");
    const selectedDest = await ruleCard.getByLabel("Destination").locator("option:checked").textContent();
    expect(selectedDest ?? "").toContain("Debt B");

    await Promise.all([
      page.waitForURL(/.*dashboard/),
      page.locator("form").first().evaluate((f: any) => {
        if (typeof f?.requestSubmit === "function") f.requestSubmit();
        else f?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      }),
    ]);
    await expect(page).toHaveURL(/.*dashboard/);
    await page.waitForLoadState("networkidle");

    const panel = page.getByTestId("debt-payoff-impact-panel");
    await expect(panel).toBeVisible();

    const debtCard = panel.locator("div", { hasText: "Debt B" }).first();
    await expect(debtCard).toBeVisible();

    const payoffText = await debtCard.getByTestId("debt-payoff-impact-text").textContent();
    expect(payoffText).toContain("Payoff:");
    expect(payoffText).toContain("was");
    expect(payoffText).toContain("now");

    // Sanity: payoff labels should differ when redirects accelerate payoff.
    const m = /Payoff:\s*was\s*(.*?)\s*→\s*now\s*(.*)\s*$/.exec((payoffText ?? "").trim());
    expect(m).toBeTruthy();
    if (m) {
      expect(m[1]).not.toBe(m[2]);
    }

    const trace = debtCard.getByTestId("debt-redirect-trace");
    await trace.locator("summary").click();

    await expect(trace.getByTestId("debt-redirect-trace-item").first()).toBeVisible();
    await expect(trace.getByText("Quick goal").first()).toBeVisible();

    // Debug/guard: verify the session persisted the redirect rule (goal -> debt).
    await page.getByRole("button", { name: "Data" }).click();
    await page.waitForLoadState("networkidle");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export JSON" }).click(),
    ]);
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    const snapshot = JSON.parse(await readFile(downloadPath!, "utf-8"));
    const currentSession = snapshot.currentSession;
    const goal = (currentSession.goalFunds as any[]).find((g) => g.name === "Quick goal");
    const debt = (currentSession.debts as any[]).find((d) => d.name === "Debt B");
    expect(goal).toBeTruthy();
    expect(debt).toBeTruthy();
    const rule = (currentSession.ceilingRedirectRules as any[]).find(
      (r) => r.sourceKind === "GoalFund" && r.sourceId === goal.id,
    );
    expect(rule).toBeTruthy();
    expect(rule.destinationKind).toBe("DebtLoan");
    expect(rule.destinationId).toBe(debt.id);
  });
});

