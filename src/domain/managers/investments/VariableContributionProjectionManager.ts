import { Money } from "@/domain/models/Money";
import { RateBps } from "@/domain/models/RateBps";

export type VariableContributionProjectionInput = Readonly<{
  name: string;
  startingBalance: Money;
  expectedAnnualReturn: RateBps;
  monthlyContributionsCents: ReadonlyArray<number>;
}>;

export type VariableContributionProjectionPoint = Readonly<{
  monthIndex: number;
  totalValue: Money;
  principal: Money;
  simpleInterestValue: Money;
}>;

export type VariableContributionProjectionSeries = Readonly<{
  name: string;
  points: ReadonlyArray<VariableContributionProjectionPoint>;
  endingValue: Money;
  endingPrincipal: Money;
  endingSimpleInterestValue: Money;
}>;

type InternalState = {
  compoundBalanceCents: number;
  principalCents: number;
  simpleInterestAccruedCents: number;
};

export class VariableContributionProjectionManager {
  public project(input: VariableContributionProjectionInput): VariableContributionProjectionSeries {
    const monthlyRate = this.annualToMonthly(input.expectedAnnualReturn.toDecimal());
    const months = Math.max(0, input.monthlyContributionsCents.length - 1);

    const state: InternalState = {
      compoundBalanceCents: Math.max(0, input.startingBalance.getCents()),
      principalCents: Math.max(0, input.startingBalance.getCents()),
      simpleInterestAccruedCents: 0,
    };

    const points: VariableContributionProjectionPoint[] = [];

    for (let m = 0; m <= months; m++) {
      points.push({
        monthIndex: m,
        totalValue: Money.fromCents(state.compoundBalanceCents),
        principal: Money.fromCents(state.principalCents),
        simpleInterestValue: Money.fromCents(state.principalCents + state.simpleInterestAccruedCents),
      });

      if (m === months) break;

      // Grow (compound) balance.
      state.compoundBalanceCents = Math.round(state.compoundBalanceCents * (1 + monthlyRate));

      // Simple-interest baseline accrues interest on principal only.
      state.simpleInterestAccruedCents += Math.round(state.principalCents * monthlyRate);

      // Apply contribution after growth (close enough for budgeting UX).
      const contrib = Math.max(0, Math.round(input.monthlyContributionsCents[m + 1] ?? 0));
      state.compoundBalanceCents += contrib;
      state.principalCents += contrib;
    }

    const last = points[points.length - 1]!;
    return {
      name: input.name,
      points,
      endingValue: last.totalValue,
      endingPrincipal: last.principal,
      endingSimpleInterestValue: last.simpleInterestValue,
    };
  }

  private annualToMonthly(annualDecimal: number): number {
    if (!Number.isFinite(annualDecimal)) return 0;
    return annualDecimal / 12;
  }
}

