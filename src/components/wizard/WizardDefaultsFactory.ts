import { BudgetSession } from "@/domain/models/BudgetSession";
import { WizardFormInputValues } from "@/components/wizard/WizardSchema";

export class WizardDefaultsFactory {
  public static fromSession(session: BudgetSession): WizardFormInputValues {
    return {
      locale: {
        taxYear: session.locale.taxYear,
      },
      assumedInflationPercent: session.assumedAnnualInflation.toPercent(),
      projectionHorizonYears: session.projectionHorizonYears,

      members: session.members.map((m) => ({
        id: m.id,
        displayName: m.displayName,
        employmentIncomeAnnual: (m.employmentIncomeAnnual.getCents() / 100).toString(),
        rrspContributionRoomAnnual: (m.rrspContributionRoomAnnual.getCents() / 100).toString(),
        tfsaRoomEntries: m.tfsaRoomEntries.map((e) => ({
          year: e.year,
          room: (e.room.getCents() / 100).toString(),
        })),
      })),

      householdAllocatedMonthly: (session.household.allocatedMonthly.getCents() / 100).toString(),
      householdCategories: session.household.categories.map((c) => ({
        name: c.name,
        monthlyAmount: (c.monthlyAmount.getCents() / 100).toString(),
      })),

      investments: session.investments.map((b) => ({
        id: b.id,
        kind: b.kind,
        name: b.name,
        ownerMemberId: b.ownerMemberId,
        startingBalance: (b.startingBalance.getCents() / 100).toString(),
        monthlyContribution: (b.monthlyContribution.getCents() / 100).toString(),
        startDateIso: b.startDateIso,
        isRecurringMonthly: b.isRecurringMonthly,
        expectedAnnualReturnPercent: b.expectedAnnualReturn.toPercent(),
        backfillContributions: b.backfillContributions.map((e) => ({
          year: e.year,
          amount: (e.amount.getCents() / 100).toString(),
        })),
      })),

      templates: session.templates.map((t) => ({
        kind: t.kind,
        name: t.name,
        monthlyAllocation: (t.monthlyAllocation.getCents() / 100).toString(),
        expectedAnnualReturnPercent: t.expectedAnnualReturn.toPercent(),
      })),

      goalFunds: session.goalFunds.map((g) => ({
        id: g.id,
        name: g.name,
        targetAmount: (g.targetAmount.getCents() / 100).toString(),
        currentBalance: (g.currentBalance.getCents() / 100).toString(),
        expectedAnnualReturnPercent: g.expectedAnnualReturn.toPercent(),
        monthlyContribution: (g.monthlyContribution.getCents() / 100).toString(),
        startDateIso: g.startDateIso,
        targetDateIso: g.targetDateIso,
      })),

      debts: session.debts.map((d) => ({
        id: d.id,
        name: d.name,
        currentBalance: (d.currentBalance.getCents() / 100).toString(),
        annualAprPercent: d.annualApr.toPercent(),
        startDateIso: d.startDateIso,
        payoffPlanKind: d.payoffPlan.kind,
        monthlyPayment:
          d.payoffPlan.kind === "monthlyPayment"
            ? (d.payoffPlan.monthlyPayment.getCents() / 100).toString()
            : "0",
        targetPayoffDateIso:
          d.payoffPlan.kind === "targetDate" ? d.payoffPlan.targetPayoffDateIso : undefined,
      })),

      redirectRules: session.ceilingRedirectRules.map((r) => ({
        id: r.id,
        sourceKind: r.sourceKind,
        sourceId: r.sourceId,
        destinationKind: r.destinationKind,
        destinationId: r.destinationId,
      })),
    };
  }
}

