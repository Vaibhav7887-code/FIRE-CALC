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

    const startingBalanceCents = Math.max(0, debt.currentBalance.getCents());
    const state: Internal = { balanceCents: startingBalanceCents };

    const computedPayment = this.computeMonthlyPayment(debt, monthlyRate);
    const paymentCents = Math.max(0, computedPayment.getCents());

    const points: DebtSchedulePoint[] = [];
    let payoffMonthIndex: number | null = null;

    for (let m = 0; m <= monthsMax; m++) {
      if (state.balanceCents <= 0 && payoffMonthIndex === null) payoffMonthIndex = m;

      const interestCents = Math.round(state.balanceCents * monthlyRate);
      const scheduledPaymentCents = state.balanceCents <= 0 ? 0 : Math.min(paymentCents, state.balanceCents + interestCents);
      const principalCents = Math.max(0, scheduledPaymentCents - interestCents);

      const endingBalanceCents = Math.max(0, state.balanceCents + interestCents - scheduledPaymentCents);

      points.push({
        monthIndex: m,
        payment: Money.fromCents(scheduledPaymentCents),
        interestPortion: Money.fromCents(Math.max(0, interestCents)),
        principalPortion: Money.fromCents(Math.max(0, principalCents)),
        endingBalance: Money.fromCents(endingBalanceCents),
      });

      state.balanceCents = endingBalanceCents;
      if (m === monthsMax) break;
    }

    return { points, payoffMonthIndex, computedMonthlyPayment: computedPayment };
  }

  public computeMonthlyPayment(debt: DebtLoan, monthlyRate: number): Money {
    if (debt.payoffPlan.kind === "monthlyPayment") return debt.payoffPlan.monthlyPayment;

    const startIso = debt.startDateIso ?? DateMonthMath.currentMonthIso();
    const months = DateMonthMath.monthsBetweenIso(startIso, debt.payoffPlan.targetPayoffDateIso);
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

