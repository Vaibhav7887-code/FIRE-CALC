import { Identifier, IdentifierFactory } from "@/domain/models/Identifiers";
import { Money } from "@/domain/models/Money";
import { TfsaRoomEntry } from "@/domain/models/InvestmentBucket";

export type HouseholdMember = Readonly<{
  id: Identifier;
  displayName: string;
  employmentIncomeAnnual: Money;
  tfsaRoomEntries: ReadonlyArray<TfsaRoomEntry>;
  rrspContributionRoomAnnual: Money;
}>;

export class HouseholdMemberFactory {
  public static createDefault(displayName: string): HouseholdMember {
    return {
      id: IdentifierFactory.create(),
      displayName: displayName.trim(),
      employmentIncomeAnnual: Money.fromDollars(120000),
      tfsaRoomEntries: [],
      rrspContributionRoomAnnual: Money.zero(),
    };
  }
}

