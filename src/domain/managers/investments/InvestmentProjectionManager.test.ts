import { describe, expect, it } from "vitest";
import { InvestmentProjectionManager } from "@/domain/managers/investments/InvestmentProjectionManager";
import { Money } from "@/domain/models/Money";
import { RateBps } from "@/domain/models/RateBps";

describe("InvestmentProjectionManager", () => {
  it("with 0% return, ending value equals principal", () => {
    const mgr = new InvestmentProjectionManager();
    const series = mgr.projectMonthlySeries(
      {
        name: "Test",
        startingBalance: Money.fromDollars(1000),
        expectedAnnualReturn: RateBps.fromPercent(0),
        recurringMonthlyContribution: Money.fromDollars(100),
        isRecurringMonthly: true,
      },
      1,
    );

    expect(series.endingValue.getCents()).toBe(series.endingPrincipal.getCents());
    expect(series.endingCompoundEarningsDelta.getCents()).toBe(0);
  });

  it("compound delta is positive for positive return over time", () => {
    const mgr = new InvestmentProjectionManager();
    const series = mgr.projectMonthlySeries(
      {
        name: "Test",
        startingBalance: Money.fromDollars(10000),
        expectedAnnualReturn: RateBps.fromPercent(6),
        recurringMonthlyContribution: Money.fromDollars(0),
        isRecurringMonthly: false,
      },
      10,
    );

    expect(series.endingValue.getCents()).toBeGreaterThan(series.endingPrincipal.getCents());
    expect(series.endingCompoundEarningsDelta.getCents()).toBeGreaterThanOrEqual(0);
  });
});

