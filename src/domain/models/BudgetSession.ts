import { HouseholdBudget, HouseholdBudgetFactory } from "@/domain/models/HouseholdBudget";
import { Identifier, IdentifierFactory } from "@/domain/models/Identifiers";
import { InvestmentBucket, InvestmentBucketFactory } from "@/domain/models/InvestmentBucket";
import { HouseholdMember, HouseholdMemberFactory } from "@/domain/models/HouseholdMember";
import { GoalFund, GoalFundFactory } from "@/domain/models/GoalFund";
import { DebtLoan } from "@/domain/models/DebtLoan";
import { CeilingRedirectRule } from "@/domain/models/CeilingRedirectRule";
import { LocaleProfile, LocaleProfileFactory } from "@/domain/models/LocaleProfile";
import { Money } from "@/domain/models/Money";
import { RateBps } from "@/domain/models/RateBps";

export type BudgetTemplateKind = "ChildFund" | "Travel" | "Trust" | "LargePurchase";

export type TemplateAllocation = Readonly<{
  id: Identifier;
  kind: BudgetTemplateKind;
  name: string;
  monthlyAllocation: Money;
  expectedAnnualReturn: RateBps;
}>;

export type BudgetSession = Readonly<{
  id: Identifier;
  locale: LocaleProfile;
  members: ReadonlyArray<HouseholdMember>;
  assumedAnnualInflation: RateBps;
  projectionHorizonYears: number;
  household: HouseholdBudget;
  investments: ReadonlyArray<InvestmentBucket>;
  templates: ReadonlyArray<TemplateAllocation>;
  goalFunds: ReadonlyArray<GoalFund>;
  debts: ReadonlyArray<DebtLoan>;
  ceilingRedirectRules: ReadonlyArray<CeilingRedirectRule>;
}>;

export class BudgetSessionFactory {
  public static createNew(): BudgetSession {
    const defaultMember = HouseholdMemberFactory.createDefault("You");
    return {
      id: IdentifierFactory.create(),
      locale: LocaleProfileFactory.createDefault(),
      members: [
        {
          ...defaultMember,
          employmentIncomeAnnual: Money.fromDollars(120000),
        },
      ],
      assumedAnnualInflation: RateBps.fromPercent(2),
      projectionHorizonYears: 30,
      household: HouseholdBudgetFactory.createWithAllocatedMonthly(Money.fromDollars(4000)),
      investments: [
        InvestmentBucketFactory.createDefault("TFSA", defaultMember.id),
        InvestmentBucketFactory.createDefault("RRSP", defaultMember.id),
      ],
      templates: [],
      goalFunds: [
        {
          ...GoalFundFactory.createDefaultEmergencyFund(),
          monthlyContribution: Money.fromDollars(500),
        },
        {
          ...GoalFundFactory.createEmpty("Vacation (Japan)"),
          monthlyContribution: Money.fromDollars(300),
          expectedAnnualReturn: RateBps.fromPercent(0),
        },
      ],
      debts: [],
      ceilingRedirectRules: [],
    };
  }

  public static createTemplate(kind: BudgetTemplateKind): TemplateAllocation {
    const names: Record<BudgetTemplateKind, string> = {
      ChildFund: "Child fund",
      Travel: "Travel",
      Trust: "Trust",
      LargePurchase: "Large purchase",
    };

    return {
      id: IdentifierFactory.create(),
      kind,
      name: names[kind],
      monthlyAllocation: Money.zero(),
      expectedAnnualReturn: RateBps.fromPercent(5),
    };
  }
}

