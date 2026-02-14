import { CeilingRedirectRule } from "@/domain/models/CeilingRedirectRule";
import { CeilingFreeCentsEvent, RedirectApplication } from "@/domain/managers/cashflow/CashflowTimelineModels";

export type RedirectDestinationResolver = Readonly<{
  goalFundIds: ReadonlySet<string>;
  investmentBucketIds: ReadonlySet<string>;
  debtIds: ReadonlySet<string>;
}>;

export class CeilingRedirectManager {
  public apply(
    event: CeilingFreeCentsEvent,
    rules: ReadonlyArray<CeilingRedirectRule>,
    resolver: RedirectDestinationResolver,
  ): ReadonlyArray<RedirectApplication> {
    // If duplicate rules exist (e.g. wizard step interactions), prefer the most recently added rule.
    // This makes rule selection stable without requiring all upstream surfaces to perfectly deduplicate.
    let rule: CeilingRedirectRule | undefined = undefined;
    for (let i = rules.length - 1; i >= 0; i--) {
      const r = rules[i];
      if (r?.sourceKind === event.sourceKind && r?.sourceId === event.sourceId) {
        rule = r;
        break;
      }
    }
    if (!rule) {
      return [
        {
          monthIndex: event.monthIndex,
          sourceKind: event.sourceKind,
          sourceId: event.sourceId,
          destinationKind: "Unallocated",
          destinationId: undefined,
          appliedCents: event.freedCents,
        },
      ];
    }

    if (rule.destinationKind === "Unallocated") {
      return [
        {
          monthIndex: event.monthIndex,
          sourceKind: event.sourceKind,
          sourceId: event.sourceId,
          destinationKind: "Unallocated",
          destinationId: undefined,
          appliedCents: event.freedCents,
        },
      ];
    }

    const destId = rule.destinationId;
    const isValid =
      (rule.destinationKind === "GoalFund" && !!destId && resolver.goalFundIds.has(destId)) ||
      (rule.destinationKind === "InvestmentBucket" && !!destId && resolver.investmentBucketIds.has(destId)) ||
      (rule.destinationKind === "DebtLoan" && !!destId && resolver.debtIds.has(destId));

    if (!isValid) {
      return [
        {
          monthIndex: event.monthIndex,
          sourceKind: event.sourceKind,
          sourceId: event.sourceId,
          destinationKind: "Unallocated",
          destinationId: undefined,
          appliedCents: event.freedCents,
        },
      ];
    }

    return [
      {
        monthIndex: event.monthIndex,
        sourceKind: event.sourceKind,
        sourceId: event.sourceId,
        destinationKind: rule.destinationKind,
        destinationId: destId,
        appliedCents: event.freedCents,
      },
    ] as const;
  }
}

