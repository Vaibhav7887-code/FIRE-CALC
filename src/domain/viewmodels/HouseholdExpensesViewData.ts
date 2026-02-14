export type HouseholdExpenseCategoryDraft = Readonly<{
  id: string;
  name: string;
  monthlyAmount: string;
}>;

export type HouseholdExpensesViewData = Readonly<{
  allocatedMonthly: string;
  categories: ReadonlyArray<HouseholdExpenseCategoryDraft>;
  remainderCents: number;
  categoriesTotalCents: number;
}>;

