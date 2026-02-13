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
  segments: ReadonlyArray<AllocationSegment>;
  nominalVsRealSeries: ReadonlyArray<NominalRealPoint>;
  earningsDecomposition: EarningsDecomposition;
  goalFundBalanceSeries: ReadonlyArray<{
    fundId: string;
    name: string;
    points: ReadonlyArray<MonthlyCentsPoint>;
  }>;
  debtBalanceSeries: ReadonlyArray<{
    debtId: string;
    name: string;
    points: ReadonlyArray<MonthlyCentsPoint>;
  }>;
}>;

