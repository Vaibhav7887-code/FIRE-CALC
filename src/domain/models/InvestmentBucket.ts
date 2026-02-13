import { Identifier, IdentifierFactory } from "@/domain/models/Identifiers";
import { Money } from "@/domain/models/Money";
import { RateBps } from "@/domain/models/RateBps";
import { IsoDateString } from "@/domain/models/GoalFund";

export type InvestmentAccountKind = "TFSA" | "RRSP" | "Custom";

export type TfsaRoomEntry = Readonly<{
  year: number;
  room: Money;
}>;

export type BackfillContributionEntry = Readonly<{
  year: number;
  amount: Money;
}>;

export class RegisteredAccountOwnershipGuards {
  public static assertOwnerRequired(kind: InvestmentAccountKind, ownerMemberId?: Identifier): void {
    if ((kind === "TFSA" || kind === "RRSP") && !ownerMemberId) {
      throw new Error(`${kind} bucket requires ownerMemberId.`);
    }
  }
}

export type InvestmentBucket = Readonly<{
  id: Identifier;
  kind: InvestmentAccountKind;
  name: string;
  ownerMemberId?: Identifier;
  startingBalance: Money;
  monthlyContribution: Money;
  isRecurringMonthly: boolean;
  expectedAnnualReturn: RateBps;
  backfillContributions: ReadonlyArray<BackfillContributionEntry>;
  startDateIso?: IsoDateString;
}>;

export class InvestmentBucketFactory {
  public static createDefault(kind: InvestmentAccountKind, ownerMemberId?: Identifier): InvestmentBucket {
    const nameByKind: Record<InvestmentAccountKind, string> = {
      TFSA: "TFSA",
      RRSP: "RRSP",
      Custom: "Custom investment",
    };

    return {
      id: IdentifierFactory.create(),
      kind,
      name: nameByKind[kind],
      ownerMemberId:
        kind === "TFSA" || kind === "RRSP" ? (ownerMemberId ?? IdentifierFactory.create()) : undefined,
      startingBalance: Money.zero(),
      monthlyContribution: Money.zero(),
      isRecurringMonthly: true,
      expectedAnnualReturn: RateBps.fromPercent(6),
      backfillContributions: [],
      startDateIso: undefined,
    };
  }

  public static createTfsaRoomEntry(year: number, room: Money): TfsaRoomEntry {
    return { year, room };
  }

  public static createBackfillContributionEntry(year: number, amount: Money): BackfillContributionEntry {
    return { year, amount };
  }
}

