import { describe, expect, it } from "vitest";
import { BudgetSessionFactory } from "@/domain/models/BudgetSession";
import { HouseholdBudgetFactory } from "@/domain/models/HouseholdBudget";
import { Money } from "@/domain/models/Money";
import { SessionHouseholdBudgetUpdater } from "@/domain/managers/household/SessionHouseholdBudgetUpdater";

describe("SessionHouseholdBudgetUpdater", () => {
  it("preserves category ids and updates amounts immutably", () => {
    const base = BudgetSessionFactory.createNew();
    const c1 = HouseholdBudgetFactory.createCategory("Rent", Money.fromDollars(2000));
    const c2 = HouseholdBudgetFactory.createCategory("Groceries", Money.fromDollars(600));
    const session = {
      ...base,
      household: {
        allocatedMonthly: Money.fromDollars(4000),
        categories: [c1, c2],
      },
    };

    const updater = new SessionHouseholdBudgetUpdater();
    const next = updater.applyDraft(session as any, {
      allocatedMonthly: "4200",
      categories: [
        { id: c1.id, name: "Rent", monthlyAmount: "2100" },
        { id: c2.id, name: "Groceries", monthlyAmount: "650" },
      ],
    });

    expect(next).not.toBe(session);
    expect(next.household).not.toBe(session.household);
    expect(next.household.categories).not.toBe(session.household.categories);

    expect(next.household.categories[0]!.id).toBe(c1.id);
    expect(next.household.categories[1]!.id).toBe(c2.id);
    expect(next.household.allocatedMonthly.getCents()).toBe(4200_00);
    expect(next.household.categories[0]!.monthlyAmount.getCents()).toBe(2100_00);
    expect(next.household.categories[1]!.monthlyAmount.getCents()).toBe(650_00);
  });

  it("clamps negative amounts to $0", () => {
    const base = BudgetSessionFactory.createNew();
    const c1 = HouseholdBudgetFactory.createCategory("Rent", Money.fromDollars(2000));
    const session = { ...base, household: { allocatedMonthly: Money.fromDollars(4000), categories: [c1] } };

    const updater = new SessionHouseholdBudgetUpdater();
    const next = updater.applyDraft(session as any, {
      allocatedMonthly: "-1",
      categories: [{ id: c1.id, name: "Rent", monthlyAmount: "-2" }],
    });

    expect(next.household.allocatedMonthly.getCents()).toBe(0);
    expect(next.household.categories[0]!.monthlyAmount.getCents()).toBe(0);
  });
});

