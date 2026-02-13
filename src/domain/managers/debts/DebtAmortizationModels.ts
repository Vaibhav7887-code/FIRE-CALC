import { Money } from "@/domain/models/Money";

export type DebtSchedulePoint = Readonly<{
  monthIndex: number;
  payment: Money;
  interestPortion: Money;
  principalPortion: Money;
  endingBalance: Money;
}>;

export type DebtScheduleResult = Readonly<{
  points: ReadonlyArray<DebtSchedulePoint>;
  payoffMonthIndex: number | null;
  computedMonthlyPayment: Money;
}>;

