import { BudgetSession } from "@/domain/models/BudgetSession";
import { HouseholdMember } from "@/domain/models/HouseholdMember";
import { Money } from "@/domain/models/Money";
import { TaxEngineManager, TaxEngineResult } from "@/domain/managers/tax/TaxEngineManager";

export type HouseholdMemberTaxResult = Readonly<{
  memberId: string;
  displayName: string;
  tax: TaxEngineResult;
}>;

export type HouseholdTaxResult = Readonly<{
  members: ReadonlyArray<HouseholdMemberTaxResult>;
  netIncomeMonthly: Money;
  netIncomeAnnual: Money;
  federalTaxAnnual: Money;
  provincialTaxAnnual: Money;
  cppAnnual: Money;
  eiAnnual: Money;
}>;

export class HouseholdTaxEngineManager {
  private readonly personTaxEngine: TaxEngineManager;

  public constructor(personTaxEngine: TaxEngineManager = new TaxEngineManager()) {
    this.personTaxEngine = personTaxEngine;
  }

  public estimate(session: BudgetSession): HouseholdTaxResult {
    const taxYear = session.locale.taxYear;

    const members: HouseholdMemberTaxResult[] = session.members.map((m) => {
      const rrspAnnual = this.calculateMemberRrspContributionAnnualCents(session, m);
      const result = this.personTaxEngine.estimate({
        taxYear,
        grossHouseholdIncomeAnnual: m.employmentIncomeAnnual,
        rrspContributionAnnual: Money.fromCents(rrspAnnual),
        rrspContributionRoomAnnual: m.rrspContributionRoomAnnual,
      });
      return { memberId: m.id, displayName: m.displayName, tax: result };
    });

    const netAnnualCents = members.reduce((sum, r) => sum + r.tax.netIncomeAnnual.getCents(), 0);
    const federalTaxAnnualCents = members.reduce((sum, r) => sum + r.tax.federalTaxAnnual.getCents(), 0);
    const provincialTaxAnnualCents = members.reduce(
      (sum, r) => sum + r.tax.provincialTaxAnnual.getCents(),
      0,
    );
    const cppAnnualCents = members.reduce((sum, r) => sum + r.tax.cppAnnual.getCents(), 0);
    const eiAnnualCents = members.reduce((sum, r) => sum + r.tax.eiAnnual.getCents(), 0);

    return {
      members,
      netIncomeAnnual: Money.fromCents(netAnnualCents),
      netIncomeMonthly: Money.fromDollars(netAnnualCents / 100 / 12),
      federalTaxAnnual: Money.fromCents(federalTaxAnnualCents),
      provincialTaxAnnual: Money.fromCents(provincialTaxAnnualCents),
      cppAnnual: Money.fromCents(cppAnnualCents),
      eiAnnual: Money.fromCents(eiAnnualCents),
    };
  }

  private calculateMemberRrspContributionAnnualCents(session: BudgetSession, member: HouseholdMember): number {
    const rrspBuckets = session.investments.filter(
      (b) => b.kind === "RRSP" && b.ownerMemberId === member.id,
    );
    const annualCents = rrspBuckets.reduce((sum, b) => {
      const recurring = b.isRecurringMonthly ? b.monthlyContribution.getCents() * 12 : 0;
      return sum + recurring;
    }, 0);
    return Math.round(annualCents);
  }
}

