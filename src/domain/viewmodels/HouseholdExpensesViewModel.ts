import { BudgetSession } from "@/domain/models/BudgetSession";
import { MoneyParser } from "@/domain/adapters/MoneyParser";
import { HouseholdExpenseCategoryDraft, HouseholdExpensesViewData } from "@/domain/viewmodels/HouseholdExpensesViewData";

export class HouseholdExpensesViewModel {
  public fromSession(session: BudgetSession): HouseholdExpensesViewData {
    const categories: HouseholdExpenseCategoryDraft[] = session.household.categories.map((c) => ({
      id: c.id,
      name: c.name,
      monthlyAmount: this.formatDollarsInput(c.monthlyAmount.getCents()),
    }));

    const allocatedMonthly = this.formatDollarsInput(session.household.allocatedMonthly.getCents());
    const categoriesTotalCents = categories.reduce((sum, c) => sum + MoneyParser.tryParseCadOrZero(c.monthlyAmount).getCents(), 0);
    const allocatedCents = MoneyParser.tryParseCadOrZero(allocatedMonthly).getCents();
    const remainderCents = allocatedCents - categoriesTotalCents;

    return { allocatedMonthly, categories, remainderCents, categoriesTotalCents };
  }

  public computeRemainderCents(draft: Readonly<{ allocatedMonthly: string; categories: ReadonlyArray<{ monthlyAmount?: string }> }>): number {
    const allocated = MoneyParser.tryParseCadOrZero(draft.allocatedMonthly).getCents();
    const used = (draft.categories ?? []).reduce((sum, c) => sum + MoneyParser.tryParseCadOrZero(c.monthlyAmount).getCents(), 0);
    return allocated - used;
  }

  private formatDollarsInput(cents: number): string {
    const dollars = cents / 100;
    const fixed = dollars.toFixed(2);
    return fixed.endsWith(".00") ? fixed.slice(0, -3) : fixed;
  }
}

