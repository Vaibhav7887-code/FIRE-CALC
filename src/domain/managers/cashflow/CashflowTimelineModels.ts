import { Money } from "@/domain/models/Money";

export type TimelineSeries = Readonly<{
  id: string;
  name: string;
  monthlyCents: ReadonlyArray<number>;
}>;

export type CashflowTimeline = Readonly<{
  months: number;
  investmentSeries: ReadonlyArray<TimelineSeries>;
  templateSeries: ReadonlyArray<TimelineSeries>;
  goalFundSeries: ReadonlyArray<TimelineSeries>;
  debtSeries: ReadonlyArray<TimelineSeries>;
  unallocatedMonthlyCents: ReadonlyArray<number>;
}>;

export type ContributionSchedule = Readonly<{
  months: number;
  byId: Readonly<Record<string, ReadonlyArray<number>>>;
}>;

export class ContributionScheduleFactory {
  public static fromSeries(series: ReadonlyArray<TimelineSeries>): ContributionSchedule {
    const months = Math.max(0, ...series.map((s) => s.monthlyCents.length));
    const byId: Record<string, ReadonlyArray<number>> = {};
    for (const s of series) byId[s.id] = s.monthlyCents;
    return { months, byId };
  }
}

export type CeilingFreeCentsEvent = Readonly<{
  monthIndex: number;
  sourceKind: "GoalFund" | "DebtLoan" | "RegisteredRoomCeiling";
  sourceId: string;
  freedCents: number;
}>;

export type RedirectApplication = Readonly<{
  monthIndex: number;
  sourceKind: CeilingFreeCentsEvent["sourceKind"];
  sourceId: string;
  destinationKind: "GoalFund" | "InvestmentBucket" | "DebtLoan" | "Unallocated";
  destinationId?: string;
  appliedCents: number;
}>;

export type CashflowTimelineResult = Readonly<{
  timeline: CashflowTimeline;
  redirectsApplied: ReadonlyArray<RedirectApplication>;
}>;

