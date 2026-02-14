import { Money } from "@/domain/models/Money";

export type AllocationSegmentKey =
  | "household"
  | `investment:${string}`
  | `template:${string}`
  | `goalFund:${string}`
  | `debt:${string}`
  | "unallocated";

export type AllocationSegment = Readonly<{
  key: AllocationSegmentKey;
  label: string;
  cents: number;
  colorClass: string;
  /**
   * If true, this segment represents a derived/fixed amount (e.g. target-date debt payment)
   * and should not be modified via the allocation slider.
   */
  isLocked?: boolean;
}>;

export type NominalRealPoint = Readonly<{
  monthIndex: number;
  nominalCents: number;
  realCents: number;
}>;

export type MonthlyCentsPoint = Readonly<{
  monthIndex: number;
  cents: number;
}>;

export type DebtRedirectTraceEntry = Readonly<{
  monthIndex: number;
  monthLabel: string;
  amountCents: number;
  sourceLabel: string;
}>;

export type DebtPayoffImpact = Readonly<{
  debtId: string;
  name: string;
  payoffWasMonthIndex: number | null;
  payoffNowMonthIndex: number | null;
  payoffWasLabel: string;
  payoffNowLabel: string;
  redirectTrace: ReadonlyArray<DebtRedirectTraceEntry>;
}>;

export type UpcomingDebt = Readonly<{
  debtId: string;
  name: string;
  /**
   * Month bucket ISO (day ignored by semantics). Typically "YYYY-MM-01".
   */
  startDateIso: string;
  plannedPaymentCents: number;
}>;

export type GoalRedirectTraceEntry = Readonly<{
  monthIndex: number;
  monthLabel: string;
  amountCents: number;
  sourceLabel: string;
}>;

export type GoalRedirectImpact = Readonly<{
  fundId: string;
  name: string;
  targetReachedWasMonthIndex: number | null;
  targetReachedNowMonthIndex: number | null;
  targetReachedWasLabel: string;
  targetReachedNowLabel: string;
  redirectTrace: ReadonlyArray<GoalRedirectTraceEntry>;
}>;

export type RedirectsAppliedTraceEntry = Readonly<{
  monthIndex: number;
  monthLabel: string;
  amountCents: number;
  sourceLabel: string;
  destinationLabel: string;
}>;

export type AssumptionsSummary = Readonly<{
  taxYear: number;
  assumedInflationPercent: number;
  projectionHorizonYears: number;
}>;

export type EarningsDecomposition = Readonly<{
  principalCents: number;
  simpleInterestTotalCents: number;
  compoundTotalCents: number;
  compoundDeltaCents: number;
}>;

export type BudgetDashboardViewData = Readonly<{
  netIncomeMonthly: Money;
  memberNetIncomeMonthly: ReadonlyArray<{
    memberId: string;
    displayName: string;
    netIncomeMonthly: Money;
  }>;
  sliderTotalCents: number;
  isOverAllocated: boolean;
  shortfallCents: number;
  segments: ReadonlyArray<AllocationSegment>;
  upcomingDebts: ReadonlyArray<UpcomingDebt>;
  assumptions: AssumptionsSummary;
  nominalVsRealSeries: ReadonlyArray<NominalRealPoint>;
  earningsDecomposition: EarningsDecomposition;
  goalFundBalanceSeries: ReadonlyArray<{
    fundId: string;
    name: string;
    startDateIso?: string;
    startOffsetMonths?: number;
    points: ReadonlyArray<MonthlyCentsPoint>;
  }>;
  goalRedirectImpacts: ReadonlyArray<GoalRedirectImpact>;
  redirectsAppliedTrace: ReadonlyArray<RedirectsAppliedTraceEntry>;
  debtBalanceSeries: ReadonlyArray<{
    debtId: string;
    name: string;
    points: ReadonlyArray<MonthlyCentsPoint>;
  }>;
  debtPayoffImpacts: ReadonlyArray<DebtPayoffImpact>;
}>;

