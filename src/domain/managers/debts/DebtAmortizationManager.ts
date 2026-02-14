import { DebtLoan } from "@/domain/models/DebtLoan";
import { Money } from "@/domain/models/Money";
import { DateMonthMath } from "@/domain/managers/debts/DateMonthMath";
import { DebtSchedulePoint, DebtScheduleResult } from "@/domain/managers/debts/DebtAmortizationModels";

type Internal = {
  balanceCents: number;
};

export class DebtAmortizationManager {
  public buildSchedule(debt: DebtLoan, horizonYears: number): DebtScheduleResult {
    const monthsMax = Math.max(0, Math.round(horizonYears * 12));
    const monthlyRate = this.annualToMonthly(debt.annualApr.toDecimal());

    const timelineStartIso = DateMonthMath.currentMonthIso();
    const startIso =
      debt.startDateIso && debt.startDateIso.length > 0 ? debt.startDateIso : timelineStartIso;
    let startOffset = 0;
    try {
      startOffset = DateMonthMath.monthsBetweenIso(timelineStartIso, startIso);
    } catch {
      startOffset = 0;
    }

    const startingBalanceCents = Math.max(0, debt.currentBalance.getCents());
    const state: Internal = { balanceCents: startOffset === 0 ? startingBalanceCents : 0 };

    const computedPayment = this.computeMonthlyPayment(debt, monthlyRate);
    const paymentCents = Math.max(0, computedPayment.getCents());

    const points: DebtSchedulePoint[] = [];
    let payoffMonthIndex: number | null = null;
    let hasOriginated = startOffset === 0;

    for (let m = 0; m <= monthsMax; m++) {
      if (!hasOriginated && m === startOffset) {
        hasOriginated = true;
        state.balanceCents = startingBalanceCents;
      }

      // IMPORTANT: pre-start months represent a non-existent debt, so do not mark it as "paid off".
      if (hasOriginated && state.balanceCents <= 0 && payoffMonthIndex === null) payoffMonthIndex = m;

      const interestCents = hasOriginated ? Math.round(state.balanceCents * monthlyRate) : 0;
      const scheduledPaymentCents =
        !hasOriginated || state.balanceCents <= 0
          ? 0
          : Math.min(paymentCents, state.balanceCents + interestCents);
      const principalCents = hasOriginated ? Math.max(0, scheduledPaymentCents - interestCents) : 0;

      const endingBalanceCents = hasOriginated
        ? Math.max(0, state.balanceCents + interestCents - scheduledPaymentCents)
        : 0;

      points.push({
        monthIndex: m,
        payment: Money.fromCents(scheduledPaymentCents),
        interestPortion: Money.fromCents(Math.max(0, interestCents)),
        principalPortion: Money.fromCents(Math.max(0, principalCents)),
        endingBalance: Money.fromCents(endingBalanceCents),
      });

      if (hasOriginated) state.balanceCents = endingBalanceCents;
      if (m === monthsMax) break;
    }

    return { points, payoffMonthIndex, computedMonthlyPayment: computedPayment };
  }

  /**
   * Convenience wrapper that derives the monthly rate from the debt's annual APR.
   * Safe for UI surfaces that may temporarily contain incomplete/invalid dates.
   */
  public computeMonthlyPaymentFromDebt(debt: DebtLoan): Money {
    const monthlyRate = this.annualToMonthly(debt.annualApr.toDecimal());
    try {
      return this.computeMonthlyPayment(debt, monthlyRate);
    } catch {
      return Money.zero();
    }
  }

  public computeMonthlyPayment(debt: DebtLoan, monthlyRate: number): Money {
    if (debt.payoffPlan.kind === "monthlyPayment") return debt.payoffPlan.monthlyPayment;

    const startIso =
      debt.startDateIso && debt.startDateIso.length > 0 ? debt.startDateIso : DateMonthMath.currentMonthIso();
    const targetIso = debt.payoffPlan.targetPayoffDateIso;
    if (!targetIso || targetIso.length === 0) return Money.zero();

    let months: number;
    try {
      months = DateMonthMath.monthsBetweenIso(startIso, targetIso);
    } catch {
      return Money.zero();
    }
    const n = Math.max(1, months);
    const pv = Math.max(0, debt.currentBalance.getCents()) / 100;

    const payment = this.paymentForPv(pv, monthlyRate, n);
    return Money.fromDollars(payment);
  }

  private paymentForPv(pv: number, monthlyRate: number, months: number): number {
    if (!Number.isFinite(pv) || pv <= 0) return 0;
    if (!Number.isFinite(monthlyRate) || monthlyRate <= 0) return pv / months;

    // P = r * PV / (1 - (1+r)^-n)
    const r = monthlyRate;
    const denom = 1 - Math.pow(1 + r, -months);
    if (denom <= 0) return pv / months;
    return (r * pv) / denom;
  }

  private annualToMonthly(annualDecimal: number): number {
    if (!Number.isFinite(annualDecimal)) return 0;
    return annualDecimal / 12;
  }
}

