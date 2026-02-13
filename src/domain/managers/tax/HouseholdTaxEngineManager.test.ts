import { describe, expect, it } from "vitest";
import { HouseholdTaxEngineManager } from "@/domain/managers/tax/HouseholdTaxEngineManager";
import { TaxEngineManager } from "@/domain/managers/tax/TaxEngineManager";
import { TaxYearConfigProvider } from "@/domain/managers/tax/TaxYearConfigProvider";
import { caBcTaxYear2026 } from "@/config/tax/ca-bc-2026";
import { BudgetSessionFactory } from "@/domain/models/BudgetSession";
import { Money } from "@/domain/models/Money";
import { HouseholdMemberFactory } from "@/domain/models/HouseholdMember";
import { IdentifierFactory } from "@/domain/models/Identifiers";
import { InvestmentBucketFactory } from "@/domain/models/InvestmentBucket";

describe("HouseholdTaxEngineManager", () => {
  it("summing member taxes differs from taxing combined gross as one person", () => {
    const personEngine = new TaxEngineManager(new TaxYearConfigProvider([caBcTaxYear2026]));
    const householdEngine = new HouseholdTaxEngineManager(personEngine);

    const memberA = {
      ...HouseholdMemberFactory.createDefault("A"),
      id: IdentifierFactory.create(),
      employmentIncomeAnnual: Money.fromDollars(130000),
    };
    const memberB = {
      ...HouseholdMemberFactory.createDefault("B"),
      id: IdentifierFactory.create(),
      employmentIncomeAnnual: Money.fromDollars(60000),
    };

    const session = {
      ...BudgetSessionFactory.createNew(),
      locale: { ...BudgetSessionFactory.createNew().locale, taxYear: 2026 },
      members: [memberA, memberB],
      investments: [
        InvestmentBucketFactory.createDefault("TFSA", memberA.id),
        InvestmentBucketFactory.createDefault("RRSP", memberA.id),
      ],
    };

    const household = householdEngine.estimate(session);
    const combined = personEngine.estimate({
      taxYear: 2026,
      grossHouseholdIncomeAnnual: Money.fromDollars(190000),
      rrspContributionAnnual: Money.fromDollars(0),
      rrspContributionRoomAnnual: Money.fromDollars(0),
    });

    // Household net should not equal combined net (progressive brackets + CPP/EI caps).
    expect(household.netIncomeAnnual.getCents()).not.toBe(combined.netIncomeAnnual.getCents());
  });

  it("RRSP deduction only affects the owning member", () => {
    const personEngine = new TaxEngineManager(new TaxYearConfigProvider([caBcTaxYear2026]));
    const householdEngine = new HouseholdTaxEngineManager(personEngine);

    const memberA = {
      ...HouseholdMemberFactory.createDefault("A"),
      id: IdentifierFactory.create(),
      employmentIncomeAnnual: Money.fromDollars(120000),
      rrspContributionRoomAnnual: Money.fromDollars(20000),
    };
    const memberB = {
      ...HouseholdMemberFactory.createDefault("B"),
      id: IdentifierFactory.create(),
      employmentIncomeAnnual: Money.fromDollars(60000),
      rrspContributionRoomAnnual: Money.fromDollars(0),
    };

    const rrspBucketA = {
      ...InvestmentBucketFactory.createDefault("RRSP", memberA.id),
      monthlyContribution: Money.fromDollars(1000), // 12k/yr
      isRecurringMonthly: true,
    };

    const session = {
      ...BudgetSessionFactory.createNew(),
      locale: { ...BudgetSessionFactory.createNew().locale, taxYear: 2026 },
      members: [memberA, memberB],
      investments: [rrspBucketA],
    };

    const result = householdEngine.estimate(session);
    const a = result.members.find((m) => m.memberId === memberA.id)!;
    const b = result.members.find((m) => m.memberId === memberB.id)!;

    expect(a.tax.rrspDeductionAnnual.getCents()).toBeGreaterThan(0);
    expect(b.tax.rrspDeductionAnnual.getCents()).toBe(0);
  });
});

