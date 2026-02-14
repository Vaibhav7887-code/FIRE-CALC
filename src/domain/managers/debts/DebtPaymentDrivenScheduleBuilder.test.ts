import { describe, expect, it } from "vitest";
import { DebtPaymentDrivenScheduleBuilder } from "@/domain/managers/debts/DebtPaymentDrivenScheduleBuilder";
import { DebtLoanFactory } from "@/domain/models/DebtLoan";
import { Money } from "@/domain/models/Money";
import { RateBps } from "@/domain/models/RateBps";
import { DateMonthMath } from "@/domain/managers/debts/DateMonthMath";

describe("DebtPaymentDrivenScheduleBuilder", () => {
  it("caps payment at (balance + interest) and returns remainder as unallocated", () => {
    const b = new DebtPaymentDrivenScheduleBuilder();
    const debt = {
      ...DebtLoanFactory.createEmpty("Test debt"),
      currentBalance: Money.fromDollars(1000),
      annualApr: RateBps.fromPercent(0),
      payoffPlan: { kind: "monthlyPayment", monthlyPayment: Money.fromDollars(0) },
    } as const;

    const res = b.build(debt as any, 1, [2000_00], { timelineStartIso: DateMonthMath.currentMonthIso() });
    expect(res.points[0]!.payment.getCents()).toBe(1000_00);
    expect(res.points[0]!.endingBalance.getCents()).toBe(0);
    expect(res.unallocatedMonthlyCents[0]).toBe(1000_00);
  });

  it("allows negative amortization when payment is less than interest", () => {
    const b = new DebtPaymentDrivenScheduleBuilder();
    const debt = {
      ...DebtLoanFactory.createEmpty("Test debt"),
      currentBalance: Money.fromDollars(1000),
      annualApr: RateBps.fromPercent(12), // 1% monthly
      payoffPlan: { kind: "monthlyPayment", monthlyPayment: Money.fromDollars(0) },
    } as const;

    const res = b.build(debt as any, 1, [5_00], { timelineStartIso: DateMonthMath.currentMonthIso() });
    // Interest ~ $10.00, payment $5.00 => ending balance increases to $1005.00
    expect(res.points[0]!.interestPortion.getCents()).toBe(5_00);
    expect(res.points[0]!.principalPortion.getCents()).toBe(0);
    expect(res.points[0]!.endingBalance.getCents()).toBe(1005_00);
  });

  it("does not allow pre-payments before the debt start date; those cents are unallocated", () => {
    const b = new DebtPaymentDrivenScheduleBuilder();
    const nowIso = DateMonthMath.currentMonthIso();
    const startIso = DateMonthMath.addMonthsIso(nowIso, 2);

    const debt = {
      ...DebtLoanFactory.createEmpty("Future-start debt"),
      currentBalance: Money.fromDollars(1000),
      annualApr: RateBps.fromPercent(0),
      startDateIso: startIso,
      payoffPlan: { kind: "monthlyPayment", monthlyPayment: Money.fromDollars(0) },
    } as const;

    const res = b.build(debt as any, 1, [500_00, 0, 100_00], { timelineStartIso: nowIso });

    // Month 0: debt doesn't exist yet; payment is not applied.
    expect(res.points[0]!.payment.getCents()).toBe(0);
    expect(res.points[0]!.endingBalance.getCents()).toBe(0);
    expect(res.unallocatedMonthlyCents[0]).toBe(500_00);

    // Month 2: debt originates and applies payment against starting balance.
    expect(res.points[2]!.payment.getCents()).toBe(100_00);
    expect(res.points[2]!.endingBalance.getCents()).toBe(900_00);
  });
});

