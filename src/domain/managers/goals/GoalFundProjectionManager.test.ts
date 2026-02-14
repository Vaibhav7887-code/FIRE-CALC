import { describe, expect, it } from "vitest";
import { GoalFundProjectionManager } from "@/domain/managers/goals/GoalFundProjectionManager";
import { GoalFundFactory } from "@/domain/models/GoalFund";
import { Money } from "@/domain/models/Money";
import { RateBps } from "@/domain/models/RateBps";

describe("GoalFundProjectionManager", () => {
  it("stops contributing after reaching target", () => {
    const mgr = new GoalFundProjectionManager();
    const goal = {
      ...GoalFundFactory.createEmpty("Test goal"),
      currentBalance: Money.zero(),
      targetAmount: Money.fromDollars(1000),
      monthlyContribution: Money.fromDollars(600),
      expectedAnnualReturn: RateBps.fromPercent(0),
    };

    const result = mgr.project(goal, 1);
    expect(result.targetReachedMonthIndex).toBe(2);

    const m1 = result.points.find((p) => p.monthIndex === 1)!;
    const m2 = result.points.find((p) => p.monthIndex === 2)!;
    const m3 = result.points.find((p) => p.monthIndex === 3)!;

    expect(m1.balance.getCents()).toBe(600_00);
    expect(m2.balance.getCents()).toBe(1000_00);
    expect(m3.balance.getCents()).toBe(1000_00);

    expect(m2.contributedPrincipal.getCents()).toBe(1000_00);
    expect(m3.contributedPrincipal.getCents()).toBe(1000_00);
  });

  it("respects start date by not contributing or growing pre-start", () => {
    const mgr = new GoalFundProjectionManager();
    const goal = {
      ...GoalFundFactory.createEmpty("Future goal"),
      currentBalance: Money.zero(),
      targetAmount: Money.fromDollars(10_000),
      monthlyContribution: Money.fromDollars(100),
      expectedAnnualReturn: RateBps.fromPercent(5),
      startDateIso: "2026-03-01",
    };

    const result = mgr.project(goal, 1, { timelineStartIso: "2026-01-01" });

    const m0 = result.points.find((p) => p.monthIndex === 0)!;
    const m1 = result.points.find((p) => p.monthIndex === 1)!;
    const m2 = result.points.find((p) => p.monthIndex === 2)!;
    const m3 = result.points.find((p) => p.monthIndex === 3)!;

    // Pre-start months (Jan/Feb) remain flat at 0 with 0 contributed principal.
    expect(m0.balance.getCents()).toBe(0);
    expect(m1.balance.getCents()).toBe(0);
    expect(m2.balance.getCents()).toBe(0);
    expect(m2.contributedPrincipal.getCents()).toBe(0);

    // First contribution occurs at/after start month (appears on the next snapshot in this manager).
    expect(m3.balance.getCents()).toBeGreaterThan(0);
  });
});

