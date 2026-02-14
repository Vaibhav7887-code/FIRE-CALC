import { GoalFund } from "@/domain/models/GoalFund";
import { Money } from "@/domain/models/Money";
import { GoalFundProjectionPoint, GoalFundProjectionResult } from "@/domain/managers/goals/GoalFundProjectionModels";
import { DateMonthMath } from "@/domain/managers/debts/DateMonthMath";

type InternalState = {
  balanceCents: number;
  contributedCents: number;
  targetReachedAt: number | null;
};

export class GoalFundProjectionManager {
  public project(
    goal: GoalFund,
    horizonYears: number,
    opts?: Readonly<{ timelineStartIso?: string }>,
  ): GoalFundProjectionResult {
    const months = Math.max(0, Math.round(horizonYears * 12));
    const targetCents = Math.max(0, goal.targetAmount.getCents());

    const monthlyRate = this.annualToMonthly(goal.expectedAnnualReturn.toDecimal());
    const monthlyContributionCents = Math.max(0, goal.monthlyContribution.getCents());

    const timelineStartIso = opts?.timelineStartIso ?? DateMonthMath.currentMonthIso();
    const startIso = goal.startDateIso && goal.startDateIso.length > 0 ? goal.startDateIso : timelineStartIso;
    const startOffset = DateMonthMath.monthsBetweenIso(timelineStartIso, startIso);

    const state: InternalState = {
      balanceCents: Math.max(0, goal.currentBalance.getCents()),
      contributedCents: 0,
      targetReachedAt: null,
    };

    const points: GoalFundProjectionPoint[] = [];

    for (let m = 0; m <= months; m++) {
      const isReached = state.balanceCents >= targetCents && targetCents > 0;
      if (isReached && state.targetReachedAt === null) state.targetReachedAt = m;

      points.push({
        monthIndex: m,
        balance: Money.fromCents(state.balanceCents),
        contributedPrincipal: Money.fromCents(state.contributedCents),
        isTargetReached: isReached,
      });

      if (m === months) break;

      // Respect start month: no growth or contributions before start.
      if (m < startOffset) continue;

      // Growth.
      state.balanceCents = Math.round(state.balanceCents * (1 + monthlyRate));

      // Contribution until target reached.
      const willContribute = targetCents <= 0 ? true : state.balanceCents < targetCents;
      if (willContribute && monthlyContributionCents > 0) {
        const needed = targetCents > 0 ? Math.max(0, targetCents - state.balanceCents) : monthlyContributionCents;
        const contribution = targetCents > 0 ? Math.min(monthlyContributionCents, needed) : monthlyContributionCents;
        state.balanceCents += contribution;
        state.contributedCents += contribution;
      }
    }

    return {
      points,
      targetReachedMonthIndex: state.targetReachedAt,
    };
  }

  private annualToMonthly(annualDecimal: number): number {
    if (!Number.isFinite(annualDecimal)) return 0;
    return annualDecimal / 12;
  }
}

