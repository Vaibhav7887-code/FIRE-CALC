import { Identifier, IdentifierFactory } from "@/domain/models/Identifiers";
import { Money } from "@/domain/models/Money";
import { RateBps } from "@/domain/models/RateBps";

export type IsoDateString = string;

export type GoalFund = Readonly<{
  id: Identifier;
  name: string;
  targetAmount: Money;
  currentBalance: Money;
  expectedAnnualReturn: RateBps;
  monthlyContribution: Money;
  startDateIso?: IsoDateString;
  targetDateIso?: IsoDateString;
}>;

export class GoalFundFactory {
  public static createEmpty(name: string): GoalFund {
    return {
      id: IdentifierFactory.create(),
      name: name.trim(),
      targetAmount: Money.zero(),
      currentBalance: Money.zero(),
      expectedAnnualReturn: RateBps.zero(),
      monthlyContribution: Money.zero(),
      startDateIso: undefined,
      targetDateIso: undefined,
    };
  }

  public static createDefaultEmergencyFund(): GoalFund {
    return {
      ...GoalFundFactory.createEmpty("Emergency fund"),
      expectedAnnualReturn: RateBps.fromPercent(3),
    };
  }
}

