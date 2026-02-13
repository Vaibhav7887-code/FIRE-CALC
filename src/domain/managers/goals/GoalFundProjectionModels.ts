import { Money } from "@/domain/models/Money";

export type GoalFundProjectionPoint = Readonly<{
  monthIndex: number;
  balance: Money;
  contributedPrincipal: Money;
  isTargetReached: boolean;
}>;

export type GoalFundProjectionResult = Readonly<{
  points: ReadonlyArray<GoalFundProjectionPoint>;
  targetReachedMonthIndex: number | null;
}>;

