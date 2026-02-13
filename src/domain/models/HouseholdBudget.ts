import { HouseholdExpenseCategory } from "@/domain/models/HouseholdExpenseCategory";
import { IdentifierFactory } from "@/domain/models/Identifiers";
import { Money } from "@/domain/models/Money";

export type HouseholdBudget = Readonly<{
  allocatedMonthly: Money;
  categories: ReadonlyArray<HouseholdExpenseCategory>;
}>;

export class HouseholdBudgetFactory {
  public static createEmpty(): HouseholdBudget {
    return { allocatedMonthly: Money.zero(), categories: [] };
  }

  public static createWithAllocatedMonthly(allocatedMonthly: Money): HouseholdBudget {
    return { allocatedMonthly, categories: [] };
  }

  public static createCategory(name: string, monthlyAmount: Money): HouseholdExpenseCategory {
    return {
      id: IdentifierFactory.create(),
      name: name.trim(),
      monthlyAmount,
    };
  }
}

