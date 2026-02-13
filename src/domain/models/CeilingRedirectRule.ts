import { Identifier, IdentifierFactory } from "@/domain/models/Identifiers";

export type CeilingSourceKind = "GoalFund" | "DebtLoan" | "RegisteredRoomCeiling";
export type RedirectDestinationKind = "GoalFund" | "InvestmentBucket" | "DebtLoan" | "Unallocated";

export type CeilingRedirectRule = Readonly<{
  id: Identifier;
  sourceKind: CeilingSourceKind;
  sourceId: Identifier;
  destinationKind: RedirectDestinationKind;
  destinationId?: Identifier;
}>;

export class CeilingRedirectRuleFactory {
  public static create(
    sourceKind: CeilingSourceKind,
    sourceId: Identifier,
    destinationKind: RedirectDestinationKind,
    destinationId?: Identifier,
  ): CeilingRedirectRule {
    return {
      id: IdentifierFactory.create(),
      sourceKind,
      sourceId,
      destinationKind,
      destinationId,
    };
  }
}

