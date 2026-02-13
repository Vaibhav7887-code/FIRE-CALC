import { IsoDateString } from "@/domain/models/GoalFund";
import { DateMonthMath } from "@/domain/managers/debts/DateMonthMath";

export class GoalFundPlanningManager {
  public computeMonthlyContributionCents(params: Readonly<{
    currentBalanceCents: number;
    targetAmountCents: number;
    startDateIso: IsoDateString;
    targetDateIso: IsoDateString;
  }>): number {
    const current = Math.max(0, Math.round(params.currentBalanceCents));
    const target = Math.max(0, Math.round(params.targetAmountCents));
    const remaining = Math.max(0, target - current);
    if (remaining <= 0) return 0;

    const months = DateMonthMath.monthsBetweenIso(params.startDateIso, params.targetDateIso);
    const denom = Math.max(1, months);
    return Math.ceil(remaining / denom);
  }

  public computeTargetDateIso(params: Readonly<{
    currentBalanceCents: number;
    targetAmountCents: number;
    startDateIso: IsoDateString;
    monthlyContributionCents: number;
  }>): IsoDateString | undefined {
    const current = Math.max(0, Math.round(params.currentBalanceCents));
    const target = Math.max(0, Math.round(params.targetAmountCents));
    const remaining = Math.max(0, target - current);
    if (remaining <= 0) return params.startDateIso;

    const monthly = Math.max(0, Math.round(params.monthlyContributionCents));
    if (monthly <= 0) return undefined;

    const months = Math.ceil(remaining / monthly);
    return DateMonthMath.addMonthsIso(params.startDateIso, months);
  }
}

