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
});

