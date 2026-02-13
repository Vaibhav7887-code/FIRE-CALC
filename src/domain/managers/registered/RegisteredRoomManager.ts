import { BudgetSession } from "@/domain/models/BudgetSession";
import { HouseholdMember } from "@/domain/models/HouseholdMember";
import { DateMonthMath } from "@/domain/managers/debts/DateMonthMath";

export type RegisteredRoomSummary = Readonly<{
  memberId: string;
  displayName: string;
  tfsaAccruedRoomCents: number;
  tfsaUsedTotalCents: number;
  tfsaRemainingCents: number;
  rrspAccruedRoomCents: number;
  rrspUsedTotalCents: number;
  rrspRemainingCents: number;
}>;

export class RegisteredRoomManager {
  public buildSummaries(session: BudgetSession): ReadonlyArray<RegisteredRoomSummary> {
    const taxYear = session.locale.taxYear;
    return session.members.map((m) => this.buildForMember(session, m, taxYear));
  }

  public buildForMember(
    session: BudgetSession,
    member: HouseholdMember,
    taxYear: number,
  ): RegisteredRoomSummary {
    const tfsaAccruedRoomCents = member.tfsaRoomEntries.reduce(
      (sum, e) => sum + e.room.getCents(),
      0,
    );

    const tfsaBackfillAllYearsCents = session.investments
      .filter((b) => b.kind === "TFSA" && b.ownerMemberId === member.id)
      .reduce((sum, b) => {
        const backfillAll = (b.backfillContributions ?? []).reduce((s2, e) => s2 + e.amount.getCents(), 0);
        return sum + backfillAll;
      }, 0);

    const tfsaRecurringCurrentYearCents = session.investments
      .filter((b) => b.kind === "TFSA" && b.ownerMemberId === member.id)
      .reduce((sum, b) => {
        if (!b.isRecurringMonthly) return sum;
        const months = RegisteredRoomManagerTaxYearMath.monthsContributingInTaxYear(
          taxYear,
          b.startDateIso,
        );
        return sum + b.monthlyContribution.getCents() * months;
      }, 0);

    const tfsaUsedTotalCents = tfsaBackfillAllYearsCents + tfsaRecurringCurrentYearCents;
    const tfsaRemainingCents = Math.max(0, tfsaAccruedRoomCents - tfsaUsedTotalCents);

    const rrspAccruedRoomCents = member.rrspContributionRoomAnnual.getCents();
    const rrspBackfillAllYearsCents = session.investments
      .filter((b) => b.kind === "RRSP" && b.ownerMemberId === member.id)
      .reduce((sum, b) => {
        const backfillAll = (b.backfillContributions ?? []).reduce((s2, e) => s2 + e.amount.getCents(), 0);
        return sum + backfillAll;
      }, 0);

    const rrspRecurringCurrentYearCents = session.investments
      .filter((b) => b.kind === "RRSP" && b.ownerMemberId === member.id)
      .reduce((sum, b) => {
        if (!b.isRecurringMonthly) return sum;
        const months = RegisteredRoomManagerTaxYearMath.monthsContributingInTaxYear(
          taxYear,
          b.startDateIso,
        );
        return sum + b.monthlyContribution.getCents() * months;
      }, 0);

    const rrspUsedTotalCents = rrspBackfillAllYearsCents + rrspRecurringCurrentYearCents;
    const rrspRemainingCents = Math.max(0, rrspAccruedRoomCents - rrspUsedTotalCents);

    return {
      memberId: member.id,
      displayName: member.displayName,
      tfsaAccruedRoomCents,
      tfsaUsedTotalCents,
      tfsaRemainingCents,
      rrspAccruedRoomCents,
      rrspUsedTotalCents,
      rrspRemainingCents,
    };
  }
}

class RegisteredRoomManagerTaxYearMath {
  public static monthsContributingInTaxYear(taxYear: number, startDateIso?: string): number {
    const yearStartIso = `${taxYear}-01-01`;
    const yearEndIso = `${taxYear + 1}-01-01`;
    const effectiveStartIso =
      startDateIso && startDateIso.length > 0
        ? RegisteredRoomManagerTaxYearMath.maxIso(yearStartIso, startDateIso)
        : yearStartIso;
    return DateMonthMath.monthsBetweenIso(effectiveStartIso, yearEndIso);
  }

  private static maxIso(aIso: string, bIso: string): string {
    const a = new Date(aIso).getTime();
    const b = new Date(bIso).getTime();
    if (!Number.isFinite(a) || !Number.isFinite(b)) return aIso;
    return a >= b ? aIso : bIso;
  }
}

