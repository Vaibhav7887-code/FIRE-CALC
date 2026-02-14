import { DebtLoan } from "@/domain/models/DebtLoan";
import { Money } from "@/domain/models/Money";
import { DateMonthMath } from "@/domain/managers/debts/DateMonthMath";
import { DebtSchedulePoint } from "@/domain/managers/debts/DebtAmortizationModels";

export type DebtPaymentDrivenScheduleResult = Readonly<{
  points: ReadonlyArray<DebtSchedulePoint>;
  /**
   * Month index (aligned to the cashflow timeline start) when the debt is already paid off at the
   * start of the month. This matches existing `DebtAmortizationManager` semantics.
   */
  payoffMonthIndex: number | null;
  /**
   * Any payment cents provided for a month that cannot be applied (pre-start or above amount due).
   * This is the remainder that should become unallocated cash that month.
   */
  unallocatedMonthlyCents: ReadonlyArray<number>;
}>;

type Internal = {
  hasOriginated: boolean;
  balanceCents: number;
};

/**
 * Builds a debt schedule driven by an external monthly payment stream (e.g. from CashflowTimelineManager).
 *
 * FIN rules:
 * - Apply monthly interest first, then payment.
 * - Cap payment to (balance + interest) so balance never goes below 0.
 * - Negative amortization is allowed if payment < interest.
 * - Pre-start months represent a non-existent debt; payments cannot be applied before start.
 */
export class DebtPaymentDrivenScheduleBuilder {
  public build(
    debt: DebtLoan,
    horizonYears: number,
    monthlyPaymentCents: ReadonlyArray<number>,
    opts?: Readonly<{ timelineStartIso?: string }>,
  ): DebtPaymentDrivenScheduleResult {
    const monthsMax = Math.max(0, Math.round(horizonYears * 12));
    const timelineStartIso = opts?.timelineStartIso ?? DateMonthMath.currentMonthIso();

    const startIso =
      debt.startDateIso && debt.startDateIso.length > 0 ? debt.startDateIso : timelineStartIso;

    let startOffset = 0;
    try {
      startOffset = DateMonthMath.monthsBetweenIso(timelineStartIso, startIso);
    } catch {
      startOffset = 0;
    }

    const monthlyRate = this.annualToMonthly(debt.annualApr.toDecimal());
    const startingBalanceCents = Math.max(0, Math.round(debt.currentBalance.getCents()));

    const state: Internal = {
      hasOriginated: startOffset === 0,
      balanceCents: startOffset === 0 ? startingBalanceCents : 0,
    };

    const points: DebtSchedulePoint[] = [];
    const unallocatedMonthlyCents: number[] = Array.from({ length: monthsMax + 1 }, () => 0);
    let payoffMonthIndex: number | null = null;

    for (let m = 0; m <= monthsMax; m++) {
      if (!state.hasOriginated && m === startOffset) {
        state.hasOriginated = true;
        state.balanceCents = startingBalanceCents;
      }

      // IMPORTANT: pre-start months represent a non-existent debt, so do not mark it as "paid off".
      if (state.hasOriginated && state.balanceCents <= 0 && payoffMonthIndex === null) payoffMonthIndex = m;

      const plannedPaymentCentsRaw = monthlyPaymentCents[m] ?? 0;
      const plannedPaymentCents = Math.max(0, Math.round(plannedPaymentCentsRaw));

      if (!state.hasOriginated) {
        // Cannot pre-pay a future-start debt; treat as unallocated for this month.
        unallocatedMonthlyCents[m] = plannedPaymentCents;
        points.push({
          monthIndex: m,
          payment: Money.zero(),
          interestPortion: Money.zero(),
          principalPortion: Money.zero(),
          endingBalance: Money.zero(),
        });
        continue;
      }

      const interestCents = Math.round(state.balanceCents * monthlyRate);
      const amountDueCents = Math.max(0, state.balanceCents + interestCents);
      const appliedPaymentCents = Math.min(plannedPaymentCents, amountDueCents);
      const unallocatedCents = Math.max(0, plannedPaymentCents - appliedPaymentCents);
      unallocatedMonthlyCents[m] = unallocatedCents;

      // Payment goes to interest first, then principal.
      const interestPaidCents = Math.max(0, Math.min(appliedPaymentCents, Math.max(0, interestCents)));
      const principalPaidCents = Math.max(0, appliedPaymentCents - interestPaidCents);

      // Negative amortization is allowed when appliedPaymentCents < interestCents.
      const endingBalanceCents = Math.max(0, state.balanceCents + interestCents - appliedPaymentCents);

      points.push({
        monthIndex: m,
        payment: Money.fromCents(appliedPaymentCents),
        interestPortion: Money.fromCents(interestPaidCents),
        principalPortion: Money.fromCents(principalPaidCents),
        endingBalance: Money.fromCents(endingBalanceCents),
      });

      state.balanceCents = endingBalanceCents;
    }

    return { points, payoffMonthIndex, unallocatedMonthlyCents };
  }

  private annualToMonthly(annualDecimal: number): number {
    if (!Number.isFinite(annualDecimal)) return 0;
    return annualDecimal / 12;
  }
}

