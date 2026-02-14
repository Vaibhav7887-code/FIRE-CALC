import { describe, expect, it } from "vitest";
import { BudgetDashboardViewModel } from "@/domain/viewmodels/BudgetDashboardViewModel";
import { BudgetSessionFactory } from "@/domain/models/BudgetSession";
import { DebtLoanFactory } from "@/domain/models/DebtLoan";
import { Money } from "@/domain/models/Money";
import { RateBps } from "@/domain/models/RateBps";
import { DebtAmortizationManager } from "@/domain/managers/debts/DebtAmortizationManager";
import { DateMonthMath } from "@/domain/managers/debts/DateMonthMath";
import { GoalFundFactory } from "@/domain/models/GoalFund";
import { CeilingRedirectRuleFactory } from "@/domain/models/CeilingRedirectRule";
import { InvestmentBucketFactory } from "@/domain/models/InvestmentBucket";

describe("BudgetDashboardViewModel (debt segments)", () => {
  it("includes implied monthly payment for target-date debts and locks the segment", () => {
    const base = BudgetSessionFactory.createNew();
    const startIso = DateMonthMath.currentMonthIso();
    const targetIso = DateMonthMath.addMonthsIso(startIso, 12);
    const debt = {
      ...DebtLoanFactory.createEmpty("Target-date debt"),
      id: "debt-1",
      currentBalance: Money.fromDollars(1200),
      annualApr: RateBps.fromPercent(0),
      startDateIso: startIso,
      payoffPlan: { kind: "targetDate", targetPayoffDateIso: targetIso },
    } as const;

    const session = { ...base, debts: [debt] };
    const amort = new DebtAmortizationManager();
    const expected = amort.computeMonthlyPaymentFromDebt(debt as any).getCents();

    const fakeTaxEngine = {
      estimate: () => ({
        netIncomeMonthly: Money.fromDollars(10_000),
        members: base.members.map((m) => ({
          memberId: m.id,
          displayName: m.displayName,
          tax: { netIncomeMonthly: Money.fromDollars(10_000) },
        })),
      }),
    };

    const vm = new BudgetDashboardViewModel(fakeTaxEngine as any);
    const viewData = vm.build(session as any);

    const seg = viewData.segments.find((s) => s.key === `debt:${debt.id}`);
    expect(seg).toBeTruthy();
    expect(seg!.cents).toBe(expected);
    expect(seg!.isLocked).toBe(true);
  });

  it("exposes future-start debts as upcoming and excludes them from current-month allocated cents", () => {
    const base = BudgetSessionFactory.createNew();
    const nowIso = DateMonthMath.currentMonthIso();
    const futureStartIso = DateMonthMath.addMonthsIso(nowIso, 3);
    const debt = {
      ...DebtLoanFactory.createEmpty("Future-start debt"),
      id: "debt-upcoming",
      currentBalance: Money.fromDollars(5000),
      annualApr: RateBps.fromPercent(5),
      startDateIso: futureStartIso,
      payoffPlan: { kind: "monthlyPayment", monthlyPayment: Money.fromDollars(250) },
    } as const;

    const session = { ...base, debts: [debt] };

    const fakeTaxEngine = {
      estimate: () => ({
        netIncomeMonthly: Money.fromDollars(10_000),
        members: base.members.map((m) => ({
          memberId: m.id,
          displayName: m.displayName,
          tax: { netIncomeMonthly: Money.fromDollars(10_000) },
        })),
      }),
    };

    const vm = new BudgetDashboardViewModel(fakeTaxEngine as any);
    const viewData = vm.build(session as any);

    const seg = viewData.segments.find((s) => s.key === `debt:${debt.id}`);
    expect(seg).toBeTruthy();
    expect(seg!.cents).toBe(0);

    expect(viewData.upcomingDebts.length).toBe(1);
    expect(viewData.upcomingDebts[0]!.debtId).toBe(debt.id);
    expect(viewData.upcomingDebts[0]!.plannedPaymentCents).toBeGreaterThan(0);
  });

  it("shows earlier payoff vs baseline when a goal redirect is applied to a debt", () => {
    const base = BudgetSessionFactory.createNew();
    const nowIso = DateMonthMath.currentMonthIso();

    const goal = {
      ...GoalFundFactory.createEmpty("Quick goal"),
      id: "goal-quick",
      startDateIso: nowIso,
      expectedAnnualReturn: RateBps.fromPercent(0),
      targetAmount: Money.fromDollars(500),
      monthlyContribution: Money.fromDollars(500),
    } as const;

    const debt = {
      ...DebtLoanFactory.createEmpty("Debt B"),
      id: "debt-b",
      currentBalance: Money.fromDollars(1000),
      annualApr: RateBps.fromPercent(0),
      startDateIso: nowIso,
      payoffPlan: { kind: "monthlyPayment", monthlyPayment: Money.fromDollars(100) },
    } as const;

    const redirect = CeilingRedirectRuleFactory.create("GoalFund", goal.id as any, "DebtLoan", debt.id as any);

    const session = {
      ...base,
      projectionHorizonYears: 3,
      investments: [],
      templates: [],
      goalFunds: [goal as any],
      debts: [debt as any],
      ceilingRedirectRules: [redirect as any],
    };

    const fakeTaxEngine = {
      estimate: () => ({
        netIncomeMonthly: Money.fromDollars(10_000),
        members: base.members.map((m) => ({
          memberId: m.id,
          displayName: m.displayName,
          tax: { netIncomeMonthly: Money.fromDollars(10_000) },
        })),
      }),
    };

    const vm = new BudgetDashboardViewModel(fakeTaxEngine as any);
    const viewData = vm.build(session as any);

    const impact = viewData.debtPayoffImpacts.find((x) => x.debtId === debt.id)!;
    expect(impact).toBeTruthy();
    expect(impact.payoffWasMonthIndex).not.toBeNull();
    expect(impact.payoffNowMonthIndex).not.toBeNull();
    expect(impact.payoffNowMonthIndex!).toBeLessThan(impact.payoffWasMonthIndex!);

    expect(impact.redirectTrace.length).toBeGreaterThan(0);
    expect(impact.redirectTrace[0]!.sourceLabel).toContain("Quick goal");
  });
});

describe("BudgetDashboardViewModel (goal redirect impacts)", () => {
  it("reflects goal-to-goal redirects in goal projections and exposes a trace", () => {
    const base = BudgetSessionFactory.createNew();
    const a = {
      ...GoalFundFactory.createEmpty("Goal A"),
      id: "goal-a",
      targetAmount: Money.fromDollars(500),
      currentBalance: Money.zero(),
      expectedAnnualReturn: RateBps.fromPercent(0),
      monthlyContribution: Money.fromDollars(500),
    } as const;
    const b = {
      ...GoalFundFactory.createEmpty("Goal B"),
      id: "goal-b",
      targetAmount: Money.fromDollars(2000),
      currentBalance: Money.zero(),
      expectedAnnualReturn: RateBps.fromPercent(0),
      monthlyContribution: Money.zero(),
    } as const;

    const session = {
      ...base,
      goalFunds: [a, b],
      ceilingRedirectRules: [
        {
          id: "r1",
          sourceKind: "GoalFund",
          sourceId: a.id,
          destinationKind: "GoalFund",
          destinationId: b.id,
        },
      ],
    };

    const fakeTaxEngine = {
      estimate: () => ({
        netIncomeMonthly: Money.fromDollars(10_000),
        members: base.members.map((m) => ({
          memberId: m.id,
          displayName: m.displayName,
          tax: { netIncomeMonthly: Money.fromDollars(10_000) },
        })),
      }),
    };

    const vm = new BudgetDashboardViewModel(fakeTaxEngine as any);
    const viewData = vm.build(session as any);

    const impactB = viewData.goalRedirectImpacts.find((g) => g.fundId === b.id)!;
    expect(impactB).toBeTruthy();
    expect(impactB.redirectTrace.length).toBeGreaterThan(0);
    expect(impactB.redirectTrace[0]!.sourceLabel).toContain("Goal: Goal A");

    // Global redirects-applied trace includes resolved labels.
    const traceRow = viewData.redirectsAppliedTrace.find(
      (t) => t.sourceLabel.includes("Goal: Goal A") && t.destinationLabel.includes("Goal: Goal B"),
    );
    expect(traceRow).toBeTruthy();

    // With redirects, Goal B should reach target earlier or equal vs baseline.
    // Baseline has no contributions to Goal B at all, so it should not be reached.
    expect(impactB.targetReachedWasMonthIndex).toBe(null);
    expect(impactB.targetReachedNowMonthIndex).not.toBe(null);
  });
});

describe("BudgetDashboardViewModel (investment recurring toggle)", () => {
  it("treats non-recurring investment monthly contributions as $0/mo in allocation segments", () => {
    const base = BudgetSessionFactory.createNew();
    const inv = {
      ...InvestmentBucketFactory.createDefault("Custom"),
      id: "inv-1",
      name: "Non-recurring bucket",
      monthlyContribution: Money.fromDollars(1000),
      isRecurringMonthly: false,
      expectedAnnualReturn: RateBps.fromPercent(0),
    } as const;

    const session = { ...base, investments: [inv] };

    const fakeTaxEngine = {
      estimate: () => ({
        netIncomeMonthly: Money.fromDollars(10_000),
        members: base.members.map((m) => ({
          memberId: m.id,
          displayName: m.displayName,
          tax: { netIncomeMonthly: Money.fromDollars(10_000) },
        })),
      }),
    };

    const vm = new BudgetDashboardViewModel(fakeTaxEngine as any);
    const viewData = vm.build(session as any);

    const seg = viewData.segments.find((s) => s.key === `investment:${inv.id}`)!;
    expect(seg).toBeTruthy();
    expect(seg.cents).toBe(0);
  });
});

describe("BudgetDashboardViewModel (shortfall)", () => {
  it("computes shortfallCents when allocations exceed net income", () => {
    const base = BudgetSessionFactory.createNew();
    const session = {
      ...base,
      household: {
        ...base.household,
        allocatedMonthly: Money.fromDollars(5000),
      },
    };

    const fakeTaxEngine = {
      estimate: () => ({
        netIncomeMonthly: Money.fromDollars(1000),
        members: base.members.map((m) => ({
          memberId: m.id,
          displayName: m.displayName,
          tax: { netIncomeMonthly: Money.fromDollars(1000) },
        })),
      }),
    };

    const vm = new BudgetDashboardViewModel(fakeTaxEngine as any);
    const viewData = vm.build(session as any);

    expect(viewData.isOverAllocated).toBe(true);
    expect(viewData.shortfallCents).toBeGreaterThan(0);
  });
});

