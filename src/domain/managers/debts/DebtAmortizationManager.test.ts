import { describe, expect, it } from "vitest";
import { DebtAmortizationManager } from "@/domain/managers/debts/DebtAmortizationManager";
import { DebtLoanFactory } from "@/domain/models/DebtLoan";
import { Money } from "@/domain/models/Money";
import { RateBps } from "@/domain/models/RateBps";
import { DateMonthMath } from "@/domain/managers/debts/DateMonthMath";

describe("DebtAmortizationManager", () => {
  it("pays off a zero-interest debt with fixed monthly payment", () => {
    const mgr = new DebtAmortizationManager();
    const debt = {
      ...DebtLoanFactory.createEmpty("Test debt"),
      currentBalance: Money.fromDollars(1200),
      annualApr: RateBps.fromPercent(0),
      payoffPlan: { kind: "monthlyPayment", monthlyPayment: Money.fromDollars(100) },
    };

    const schedule = mgr.buildSchedule(debt, 2);
    expect(schedule.payoffMonthIndex).toBe(12);
    expect(schedule.points[12]!.endingBalance.getCents()).toBe(0);
  });

  it("computes payment from target payoff date at 0% APR", () => {
    const mgr = new DebtAmortizationManager();
    const debt = {
      ...DebtLoanFactory.createEmpty("Test debt"),
      currentBalance: Money.fromDollars(1200),
      annualApr: RateBps.fromPercent(0),
      startDateIso: "2026-01-01",
      payoffPlan: { kind: "targetDate", targetPayoffDateIso: "2027-01-01" },
    };

    const payment = mgr.computeMonthlyPayment(debt, 0);
    expect(payment.getCents()).toBe(100_00);
  });

  it("computes payment from target payoff date using annual APR helper", () => {
    const mgr = new DebtAmortizationManager();
    const debt = {
      ...DebtLoanFactory.createEmpty("Test debt"),
      currentBalance: Money.fromDollars(1200),
      annualApr: RateBps.fromPercent(0),
      startDateIso: "2026-01-01",
      payoffPlan: { kind: "targetDate", targetPayoffDateIso: "2027-01-01" },
    };

    const payment = mgr.computeMonthlyPaymentFromDebt(debt);
    expect(payment.getCents()).toBe(100_00);
  });

  it("honors future start date: pre-start months are zero and start month originates", () => {
    const mgr = new DebtAmortizationManager();
    const nowIso = DateMonthMath.currentMonthIso();
    const startIso = DateMonthMath.addMonthsIso(nowIso, 2);

    const debt = {
      ...DebtLoanFactory.createEmpty("Future-start debt"),
      currentBalance: Money.fromDollars(1000),
      annualApr: RateBps.fromPercent(0),
      startDateIso: startIso,
      payoffPlan: { kind: "monthlyPayment", monthlyPayment: Money.fromDollars(100) },
    } as const;

    const schedule = mgr.buildSchedule(debt as any, 1);

    // Pre-start months: debt does not exist yet.
    expect(schedule.points[0]!.endingBalance.getCents()).toBe(0);
    expect(schedule.points[0]!.payment.getCents()).toBe(0);
    expect(schedule.points[0]!.interestPortion.getCents()).toBe(0);
    expect(schedule.points[1]!.endingBalance.getCents()).toBe(0);
    expect(schedule.points[1]!.payment.getCents()).toBe(0);

    // Start month: opening balance becomes currentBalance, then normal monthly amortization runs.
    // With 0% APR and $100 payment, ending should be $900.
    expect(schedule.points[2]!.payment.getCents()).toBe(100_00);
    expect(schedule.points[2]!.interestPortion.getCents()).toBe(0);
    expect(schedule.points[2]!.principalPortion.getCents()).toBe(100_00);
    expect(schedule.points[2]!.endingBalance.getCents()).toBe(900_00);
  });
});

