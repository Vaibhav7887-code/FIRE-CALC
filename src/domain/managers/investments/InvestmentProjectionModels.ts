import { Money } from "@/domain/models/Money";
import { RateBps } from "@/domain/models/RateBps";

export type ProjectionBucketInput = Readonly<{
  name: string;
  startingBalance: Money;
  expectedAnnualReturn: RateBps;
  recurringMonthlyContribution: Money;
  isRecurringMonthly: boolean;
}>;

export type ProjectionPoint = Readonly<{
  monthIndex: number;
  totalValue: Money;
  principalContributed: Money;
  simpleInterestValue: Money;
  compoundEarningsDelta: Money;
}>;

export type ProjectionSeries = Readonly<{
  points: ReadonlyArray<ProjectionPoint>;
  endingValue: Money;
  endingPrincipal: Money;
  endingSimpleInterestValue: Money;
  endingCompoundEarningsDelta: Money;
}>;

