import { describe, expect, it } from "vitest";
import { CashflowTimelineManager } from "@/domain/managers/cashflow/CashflowTimelineManager";
import { BudgetSessionFactory } from "@/domain/models/BudgetSession";
import { GoalFundFactory } from "@/domain/models/GoalFund";
import { Money } from "@/domain/models/Money";
import { RateBps } from "@/domain/models/RateBps";
import { DateMonthMath } from "@/domain/managers/debts/DateMonthMath";

describe("CashflowTimelineManager (goal start date ceilings)", () => {
  it("keeps future-start goals at $0 then caps final contribution to target", () => {
    const nowIso = DateMonthMath.currentMonthIso();
    const startIso = DateMonthMath.addMonthsIso(nowIso, 2);

    const goal = {
      ...GoalFundFactory.createEmpty("Future-start goal"),
      currentBalance: Money.zero(),
      targetAmount: Money.fromCents(100_00),
      monthlyContribution: Money.fromCents(60_00),
      expectedAnnualReturn: RateBps.fromPercent(0),
      startDateIso: startIso,
    };

    const base = BudgetSessionFactory.createNew();
    const session = {
      ...base,
      projectionHorizonYears: 1,
      goalFunds: [goal],
      debts: [],
      investments: [],
      templates: [],
      ceilingRedirectRules: [],
    };

    const mgr = new CashflowTimelineManager();
    const { timeline } = mgr.build(session as any);

    const series = timeline.goalFundSeries.find((s) => s.id === goal.id);
    expect(series).toBeTruthy();

    const monthly = series!.monthlyCents;
    expect(monthly[0]).toBe(0);
    expect(monthly[1]).toBe(0);
    expect(monthly[2]).toBe(60_00);
    expect(monthly[3]).toBe(40_00);
    expect(monthly[4]).toBe(0);
  });
});

