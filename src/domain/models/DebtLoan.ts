import { Identifier, IdentifierFactory } from "@/domain/models/Identifiers";
import { Money } from "@/domain/models/Money";
import { RateBps } from "@/domain/models/RateBps";
import { IsoDateString } from "@/domain/models/GoalFund";

export type DebtPayoffPlan =
  | Readonly<{ kind: "monthlyPayment"; monthlyPayment: Money }>
  | Readonly<{ kind: "targetDate"; targetPayoffDateIso: IsoDateString }>;

export type DebtLoan = Readonly<{
  id: Identifier;
  name: string;
  currentBalance: Money;
  annualApr: RateBps;
  startDateIso?: IsoDateString;
  payoffPlan: DebtPayoffPlan;
}>;

export class DebtLoanFactory {
  public static createEmpty(name: string): DebtLoan {
    return {
      id: IdentifierFactory.create(),
      name: name.trim(),
      currentBalance: Money.zero(),
      annualApr: RateBps.fromPercent(0),
      startDateIso: undefined,
      payoffPlan: { kind: "monthlyPayment", monthlyPayment: Money.zero() },
    };
  }
}

