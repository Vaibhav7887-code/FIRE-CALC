import { describe, expect, it } from "vitest";
import { WizardDebtPaymentCalculator } from "@/components/wizard/WizardDebtPaymentCalculator";
import { DebtAmortizationManager } from "@/domain/managers/debts/DebtAmortizationManager";
import { DateMonthMath } from "@/domain/managers/debts/DateMonthMath";

describe("WizardDebtPaymentCalculator", () => {
  it("computes implied monthly payment for target-date debts", () => {
    const calc = new WizardDebtPaymentCalculator(new DebtAmortizationManager(), "2026-01-01");

    const debt = {
      id: "d1",
      name: "Car loan",
      currentBalance: "1200",
      annualAprPercent: 0,
      startDateIso: undefined,
      payoffPlanKind: "targetDate",
      monthlyPayment: "0",
      targetPayoffDateIso: "2027-01-01",
    } as any;

    expect(calc.monthlyPaymentCents(debt)).toBe(100_00);
  });

  it("sums monthly payments for mixed debt plan kinds", () => {
    const calc = new WizardDebtPaymentCalculator(new DebtAmortizationManager(), "2026-01-01");

    const debts = [
      {
        id: "d1",
        name: "Loan A",
        currentBalance: "1200",
        annualAprPercent: 0,
        startDateIso: undefined,
        payoffPlanKind: "targetDate",
        monthlyPayment: "0",
        targetPayoffDateIso: "2027-01-01",
      },
      {
        id: "d2",
        name: "Loan B",
        currentBalance: "500",
        annualAprPercent: 5,
        startDateIso: undefined,
        payoffPlanKind: "monthlyPayment",
        monthlyPayment: "50",
        targetPayoffDateIso: undefined,
      },
    ] as any;

    expect(calc.sumMonthlyPaymentsCents(debts)).toBe(100_00 + 50_00);
  });

  it("treats future-start debts as $0 this month but still reports planned payment", () => {
    const timelineStartIso = DateMonthMath.currentMonthIso();
    const futureStart = DateMonthMath.addMonthsIso(timelineStartIso, 2);
    const calc = new WizardDebtPaymentCalculator(new DebtAmortizationManager(), timelineStartIso);

    const debt = {
      id: "d3",
      name: "Future mortgage",
      currentBalance: "10000",
      annualAprPercent: 5,
      startDateIso: futureStart,
      payoffPlanKind: "monthlyPayment",
      monthlyPayment: "500",
      targetPayoffDateIso: undefined,
    } as any;

    expect(calc.monthlyPaymentCents(debt)).toBe(500_00);
    expect(calc.monthlyPaymentCentsThisMonth(debt)).toBe(0);
    expect(calc.sumMonthlyPaymentsCentsThisMonth([debt])).toBe(0);

    const upcoming = calc.upcomingDebts([debt]);
    expect(upcoming.length).toBe(1);
    expect(upcoming[0]!.plannedPaymentCents).toBe(500_00);
  });
});

