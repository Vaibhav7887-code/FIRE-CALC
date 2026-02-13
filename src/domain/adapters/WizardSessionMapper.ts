import {
  BudgetSession,
  BudgetSessionFactory,
  BudgetTemplateKind,
  CeilingRedirectRule,
  DebtLoan,
  GoalFund,
  HouseholdBudgetFactory,
  HouseholdMember,
  InvestmentAccountKind,
  InvestmentBucket,
  InvestmentBucketFactory,
  LocaleProfileFactory,
  Money,
  RateBps,
} from "@/domain/models";
import { WizardFormValues } from "@/components/wizard/WizardSchema";

export class WizardSessionMapper {
  public map(values: WizardFormValues): BudgetSession {
    const base = BudgetSessionFactory.createNew();

    const locale = {
      ...LocaleProfileFactory.createDefault(),
      taxYear: values.locale.taxYear,
    };

    const members: HouseholdMember[] = values.members.map((m) => ({
      id: m.id,
      displayName: m.displayName.trim(),
      employmentIncomeAnnual: Money.parseCadDollars(m.employmentIncomeAnnual),
      rrspContributionRoomAnnual: Money.parseCadDollars(m.rrspContributionRoomAnnual),
      tfsaRoomEntries: m.tfsaRoomEntries.map((e) =>
        InvestmentBucketFactory.createTfsaRoomEntry(e.year, Money.parseCadDollars(e.room)),
      ),
    }));

    const investments: InvestmentBucket[] = values.investments.map((b) => {
      const kind = b.kind as InvestmentAccountKind;
      const baseBucket = InvestmentBucketFactory.createDefault(kind, b.ownerMemberId);

      return {
        ...baseBucket,
        id: b.id,
        kind,
        name: b.name.trim(),
        ownerMemberId: b.ownerMemberId,
        startingBalance: Money.parseCadDollars(b.startingBalance),
        monthlyContribution: Money.parseCadDollars(b.monthlyContribution),
        startDateIso: b.startDateIso,
        isRecurringMonthly: b.isRecurringMonthly,
        expectedAnnualReturn: RateBps.fromPercent(b.expectedAnnualReturnPercent),
        backfillContributions: b.backfillContributions.map((e) =>
          InvestmentBucketFactory.createBackfillContributionEntry(
            e.year,
            Money.parseCadDollars(e.amount),
          ),
        ),
      };
    });

    const templates = values.templates.map((t) => ({
      ...BudgetSessionFactory.createTemplate(t.kind as BudgetTemplateKind),
      kind: t.kind as BudgetTemplateKind,
      name: t.name.trim(),
      monthlyAllocation: Money.parseCadDollars(t.monthlyAllocation),
      expectedAnnualReturn: RateBps.fromPercent(t.expectedAnnualReturnPercent),
    }));

    const goalFunds: GoalFund[] = values.goalFunds.map((g) => ({
      id: g.id,
      name: g.name.trim(),
      targetAmount: Money.parseCadDollars(g.targetAmount),
      currentBalance: Money.parseCadDollars(g.currentBalance),
      expectedAnnualReturn: RateBps.fromPercent(g.expectedAnnualReturnPercent),
      monthlyContribution: Money.parseCadDollars(g.monthlyContribution),
      startDateIso: g.startDateIso,
      targetDateIso: g.targetDateIso,
    }));

    const debts: DebtLoan[] = values.debts.map((d) => ({
      id: d.id,
      name: d.name.trim(),
      currentBalance: Money.parseCadDollars(d.currentBalance),
      annualApr: RateBps.fromPercent(d.annualAprPercent),
      startDateIso: d.startDateIso,
      payoffPlan:
        d.payoffPlanKind === "monthlyPayment"
          ? { kind: "monthlyPayment", monthlyPayment: Money.parseCadDollars(d.monthlyPayment) }
          : { kind: "targetDate", targetPayoffDateIso: d.targetPayoffDateIso ?? "" },
    }));

    const ceilingRedirectRules: CeilingRedirectRule[] = values.redirectRules.map((r) => ({
      id: r.id,
      sourceKind: r.sourceKind as any,
      sourceId: r.sourceId,
      destinationKind: r.destinationKind as any,
      destinationId: r.destinationId,
    }));

    return {
      ...base,
      locale,
      members,
      assumedAnnualInflation: RateBps.fromPercent(values.assumedInflationPercent),
      projectionHorizonYears: values.projectionHorizonYears,
      household: {
        allocatedMonthly: Money.parseCadDollars(values.householdAllocatedMonthly),
        categories: values.householdCategories.map((c) =>
          HouseholdBudgetFactory.createCategory(
            c.name,
            Money.parseCadDollars(c.monthlyAmount),
          ),
        ),
      },
      investments,
      templates,
      goalFunds,
      debts,
      ceilingRedirectRules,
    };
  }
}

