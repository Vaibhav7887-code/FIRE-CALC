import { describe, expect, it } from "vitest";
import { DebtAmortizationManager } from "@/domain/managers/debts/DebtAmortizationManager";
import { DebtLoanFactory } from "@/domain/models/DebtLoan";
import { Money } from "@/domain/models/Money";
import { RateBps } from "@/domain/models/RateBps";

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
});

