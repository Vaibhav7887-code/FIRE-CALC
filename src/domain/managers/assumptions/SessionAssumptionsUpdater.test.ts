import { describe, expect, it } from "vitest";
import { BudgetSessionFactory } from "@/domain/models/BudgetSession";
import { SessionAssumptionsUpdater } from "@/domain/managers/assumptions/SessionAssumptionsUpdater";

describe("SessionAssumptionsUpdater", () => {
  it("updates tax year, inflation %, and horizon years", () => {
    const base = BudgetSessionFactory.createNew();
    const updater = new SessionAssumptionsUpdater();
    const next = updater.applyDraft(base as any, {
      taxYear: "2027",
      assumedInflationPercent: "3.5",
      projectionHorizonYears: "10",
    });

    expect(next).not.toBe(base);
    expect(next.locale.taxYear).toBe(2027);
    expect(next.assumedAnnualInflation.toPercent()).toBe(3.5);
    expect(next.projectionHorizonYears).toBe(10);
  });
});

