import { BudgetSession } from "@/domain/models/BudgetSession";
import { HouseholdExpenseCategory } from "@/domain/models/HouseholdExpenseCategory";
import { Money } from "@/domain/models/Money";
import { MoneyParser } from "@/domain/adapters/MoneyParser";

export type HouseholdBudgetDraft = Readonly<{
  allocatedMonthly: string;
  categories: ReadonlyArray<
    Readonly<{
      id: string;
      name: string;
      monthlyAmount: string;
    }>
  >;
}>;

export class SessionHouseholdBudgetUpdater {
  public applyDraft(session: BudgetSession, draft: HouseholdBudgetDraft): BudgetSession {
    const allocatedMonthly = MoneyParser.tryParseCadOrZero(draft.allocatedMonthly);
    const categories: HouseholdExpenseCategory[] = (draft.categories ?? []).map((c) => ({
      id: c.id,
      name: (c.name ?? "").trim(),
      monthlyAmount: this.clampNonNegative(MoneyParser.tryParseCadOrZero(c.monthlyAmount)),
    }));

    return {
      ...session,
      household: {
        ...session.household,
        allocatedMonthly: this.clampNonNegative(allocatedMonthly),
        categories,
      },
    };
  }

  private clampNonNegative(m: Money): Money {
    return m.isNegative() ? Money.zero() : m;
  }
}

