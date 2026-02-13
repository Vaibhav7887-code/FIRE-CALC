import {
  ProjectionBucketInput,
  ProjectionPoint,
  ProjectionSeries,
} from "@/domain/managers/investments/InvestmentProjectionModels";
import { Money } from "@/domain/models/Money";

type InternalState = {
  compoundBalanceCents: number;
  principalCents: number;
  simpleInterestAccruedCents: number;
};

export class InvestmentProjectionManager {
  public projectMonthlySeries(
    input: ProjectionBucketInput,
    horizonYears: number,
  ): ProjectionSeries {
    const months = Math.max(0, Math.round(horizonYears * 12));

    const monthlyRate = this.calculateMonthlyRate(input.expectedAnnualReturn.toDecimal());

    const startingCents = input.startingBalance.getCents();
    const recurringCents = input.isRecurringMonthly ? input.recurringMonthlyContribution.getCents() : 0;

    const state: InternalState = {
      compoundBalanceCents: startingCents,
      principalCents: startingCents,
      simpleInterestAccruedCents: 0,
    };

    const points: ProjectionPoint[] = [];

    // Month 0 snapshot.
    points.push(this.createPoint(0, state));

    for (let m = 1; m <= months; m++) {
      // Compound: growth on total balance.
      state.compoundBalanceCents = Math.round(state.compoundBalanceCents * (1 + monthlyRate));

      // Simple interest: interest accrues on principal only (no interest-on-interest).
      state.simpleInterestAccruedCents += Math.round(state.principalCents * monthlyRate);

      // End-of-month contribution.
      state.compoundBalanceCents += recurringCents;
      state.principalCents += recurringCents;

      points.push(this.createPoint(m, state));
    }

    const last = points[points.length - 1]!;
    return {
      points,
      endingValue: last.totalValue,
      endingPrincipal: last.principalContributed,
      endingSimpleInterestValue: last.simpleInterestValue,
      endingCompoundEarningsDelta: last.compoundEarningsDelta,
    };
  }

  private calculateMonthlyRate(annualDecimal: number): number {
    if (!Number.isFinite(annualDecimal)) return 0;
    return annualDecimal / 12;
  }

  private createPoint(monthIndex: number, state: InternalState): ProjectionPoint {
    const simpleTotal = state.principalCents + state.simpleInterestAccruedCents;
    const compoundDelta = state.compoundBalanceCents - simpleTotal;
    return {
      monthIndex,
      totalValue: Money.fromCents(state.compoundBalanceCents),
      principalContributed: Money.fromCents(state.principalCents),
      simpleInterestValue: Money.fromCents(simpleTotal),
      compoundEarningsDelta: Money.fromCents(compoundDelta),
    };
  }
}

