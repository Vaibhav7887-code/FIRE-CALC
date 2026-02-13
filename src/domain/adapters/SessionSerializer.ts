import { BudgetSession, TemplateAllocation } from "@/domain/models/BudgetSession";
import { HouseholdBudget } from "@/domain/models/HouseholdBudget";
import { HouseholdExpenseCategory } from "@/domain/models/HouseholdExpenseCategory";
import { HouseholdMember } from "@/domain/models/HouseholdMember";
import { IdentifierFactory } from "@/domain/models/Identifiers";
import { InvestmentBucket, TfsaRoomEntry } from "@/domain/models/InvestmentBucket";
import { LocaleProfile } from "@/domain/models/LocaleProfile";
import { Money } from "@/domain/models/Money";
import { RateBps } from "@/domain/models/RateBps";

export type PersistedSnapshotV1 = Readonly<{
  version: 1;
  originalSession: PersistedBudgetSessionV1;
  currentSession: PersistedBudgetSessionV1;
}>;

export type PersistedSnapshotV2 = Readonly<{
  version: 2;
  originalSession: PersistedBudgetSessionV2;
  currentSession: PersistedBudgetSessionV2;
}>;

export type PersistedSnapshotV3 = Readonly<{
  version: 3;
  originalSession: PersistedBudgetSessionV3;
  currentSession: PersistedBudgetSessionV3;
}>;

export type PersistedSnapshot = PersistedSnapshotV3;

type PersistedInvestmentKind = "TFSA" | "RRSP" | "Custom" | "EmergencyCash";

export type PersistedBudgetSessionV1 = Readonly<{
  id: string;
  locale: LocaleProfile;
  grossHouseholdIncomeAnnualCents: number;
  assumedAnnualInflationBps: number;
  projectionHorizonYears: number;
  household: PersistedHouseholdBudget;
  investments: ReadonlyArray<PersistedInvestmentBucketV1>;
  templates: ReadonlyArray<PersistedTemplateAllocation>;
  luxuryMonthlyCents: number;
  cashSavingsMonthlyCents: number;
}>;

export type PersistedHouseholdMember = Readonly<{
  id: string;
  displayName: string;
  employmentIncomeAnnualCents: number;
  tfsaRoomEntries: ReadonlyArray<PersistedTfsaRoomEntry>;
  rrspContributionRoomAnnualCents: number;
}>;

export type PersistedBudgetSessionV2 = Readonly<{
  id: string;
  locale: LocaleProfile;
  members: ReadonlyArray<PersistedHouseholdMember>;
  assumedAnnualInflationBps: number;
  projectionHorizonYears: number;
  household: PersistedHouseholdBudget;
  investments: ReadonlyArray<PersistedInvestmentBucketV2>;
  templates: ReadonlyArray<PersistedTemplateAllocation>;
  luxuryMonthlyCents: number;
  cashSavingsMonthlyCents: number;
}>;

export type PersistedGoalFund = Readonly<{
  id: string;
  name: string;
  targetAmountCents: number;
  currentBalanceCents: number;
  expectedAnnualReturnBps: number;
  monthlyContributionCents: number;
  startDateIso?: string;
  targetDateIso?: string;
}>;

export type PersistedDebtLoan = Readonly<{
  id: string;
  name: string;
  currentBalanceCents: number;
  annualAprBps: number;
  startDateIso?: string;
  payoffPlan:
    | { kind: "monthlyPayment"; monthlyPaymentCents: number }
    | { kind: "targetDate"; targetPayoffDateIso: string };
}>;

export type PersistedCeilingRedirectRule = Readonly<{
  id: string;
  sourceKind: "GoalFund" | "DebtLoan" | "RegisteredRoomCeiling";
  sourceId: string;
  destinationKind: "GoalFund" | "InvestmentBucket" | "DebtLoan" | "Unallocated";
  destinationId?: string;
}>;

export type PersistedBudgetSessionV3 = Readonly<{
  id: string;
  locale: LocaleProfile;
  members: ReadonlyArray<PersistedHouseholdMember>;
  assumedAnnualInflationBps: number;
  projectionHorizonYears: number;
  household: PersistedHouseholdBudget;
  investments: ReadonlyArray<PersistedInvestmentBucketV2>;
  templates: ReadonlyArray<PersistedTemplateAllocation>;
  goalFunds: ReadonlyArray<PersistedGoalFund>;
  debts: ReadonlyArray<PersistedDebtLoan>;
  ceilingRedirectRules: ReadonlyArray<PersistedCeilingRedirectRule>;
}>;
export type PersistedHouseholdBudget = Readonly<{
  allocatedMonthlyCents: number;
  categories: ReadonlyArray<PersistedHouseholdExpenseCategory>;
}>;

export type PersistedHouseholdExpenseCategory = Readonly<{
  id: string;
  name: string;
  monthlyAmountCents: number;
}>;

export type PersistedTfsaRoomEntry = Readonly<{
  year: number;
  roomCents: number;
}>;

export type PersistedInvestmentBucketV1 = Readonly<{
  id: string;
  kind: PersistedInvestmentKind;
  name: string;
  startingBalanceCents: number;
  monthlyContributionCents: number;
  oneTimeContributionCents: number;
  isRecurringMonthly: boolean;
  expectedAnnualReturnBps: number;
  tfsaRoomEntries?: ReadonlyArray<PersistedTfsaRoomEntry>;
  rrspContributionRoomCents?: number;
}>;

export type PersistedInvestmentBucketV2 = Readonly<{
  id: string;
  kind: PersistedInvestmentKind;
  name: string;
  ownerMemberId?: string;
  startingBalanceCents: number;
  monthlyContributionCents: number;
  isRecurringMonthly: boolean;
  expectedAnnualReturnBps: number;
  startDateIso?: string;
  // v3+: room-only historical entries (do not affect cashflow)
  backfillContributions?: ReadonlyArray<{ year: number; amountCents: number }>;
  // legacy (v2) support: treat as a single backfill entry in taxYear
  oneTimeContributionCents?: number;
}>;

export type PersistedTemplateAllocation = Readonly<{
  id: string;
  kind: TemplateAllocation["kind"];
  name: string;
  monthlyAllocationCents: number;
  expectedAnnualReturnBps: number;
}>;

export class SessionSerializer {
  public snapshotToJson(snapshot: PersistedSnapshotV3): string {
    return JSON.stringify(snapshot, null, 2);
  }

  public snapshotFromJson(json: string): PersistedSnapshotV3 {
    const parsed = JSON.parse(json) as PersistedSnapshotV1 | PersistedSnapshotV2 | PersistedSnapshotV3;
    if (!parsed || (parsed as any).version === undefined) throw new Error("Invalid snapshot.");

    if (parsed.version === 3) return parsed;
    if (parsed.version === 2) return this.migrateV2ToV3(parsed);
    if (parsed.version === 1) return this.migrateV2ToV3(this.migrateV1ToV2(parsed));

    throw new Error("Unsupported snapshot version.");
  }

  public toSnapshot(original: BudgetSession, current: BudgetSession): PersistedSnapshotV3 {
    return {
      version: 3,
      originalSession: this.toPersistedSession(original),
      currentSession: this.toPersistedSession(current),
    };
  }

  public fromSnapshot(snapshot: PersistedSnapshotV3): Readonly<{
    original: BudgetSession;
    current: BudgetSession;
  }> {
    return {
      original: this.fromPersistedSession(snapshot.originalSession),
      current: this.fromPersistedSession(snapshot.currentSession),
    };
  }

  private toPersistedSession(session: BudgetSession): PersistedBudgetSessionV3 {
    return {
      id: session.id,
      locale: session.locale,
      members: session.members.map((m) => this.toPersistedMember(m)),
      assumedAnnualInflationBps: session.assumedAnnualInflation.getBasisPoints(),
      projectionHorizonYears: session.projectionHorizonYears,
      household: this.toPersistedHousehold(session.household),
      investments: session.investments.map((b) => this.toPersistedInvestmentBucketV2(b)),
      templates: session.templates.map((t) => this.toPersistedTemplate(t)),
      goalFunds: session.goalFunds.map((g) => ({
        id: g.id,
        name: g.name,
        targetAmountCents: g.targetAmount.getCents(),
        currentBalanceCents: g.currentBalance.getCents(),
        expectedAnnualReturnBps: g.expectedAnnualReturn.getBasisPoints(),
        monthlyContributionCents: g.monthlyContribution.getCents(),
        startDateIso: g.startDateIso,
        targetDateIso: g.targetDateIso,
      })),
      debts: session.debts.map((d) => ({
        id: d.id,
        name: d.name,
        currentBalanceCents: d.currentBalance.getCents(),
        annualAprBps: d.annualApr.getBasisPoints(),
        startDateIso: d.startDateIso,
        payoffPlan:
          d.payoffPlan.kind === "monthlyPayment"
            ? { kind: "monthlyPayment", monthlyPaymentCents: d.payoffPlan.monthlyPayment.getCents() }
            : { kind: "targetDate", targetPayoffDateIso: d.payoffPlan.targetPayoffDateIso },
      })),
      ceilingRedirectRules: session.ceilingRedirectRules.map((r) => ({
        id: r.id,
        sourceKind: r.sourceKind,
        sourceId: r.sourceId,
        destinationKind: r.destinationKind,
        destinationId: r.destinationId,
      })),
    };
  }

  private fromPersistedSession(p: PersistedBudgetSessionV3): BudgetSession {
    const emergencyBuckets = p.investments.filter((b) => b.kind === "EmergencyCash");
    const convertedEmergencyGoals: PersistedGoalFund[] = emergencyBuckets.map((b) => ({
      id: IdentifierFactory.create(),
      name: b.name?.trim().length ? b.name : "Emergency fund",
      targetAmountCents: 0,
      currentBalanceCents: b.startingBalanceCents,
      expectedAnnualReturnBps: b.expectedAnnualReturnBps,
      monthlyContributionCents: b.monthlyContributionCents,
    }));

    return {
      id: p.id,
      locale: p.locale,
      members: p.members.map((m) => this.fromPersistedMember(m)),
      assumedAnnualInflation: RateBps.fromBasisPoints(p.assumedAnnualInflationBps),
      projectionHorizonYears: p.projectionHorizonYears,
      household: this.fromPersistedHousehold(p.household),
      investments: p.investments
        .filter((b) => b.kind !== "EmergencyCash")
        .map((b) => this.fromPersistedInvestmentBucketV2(b, p.locale.taxYear)),
      templates: p.templates.map((t) => this.fromPersistedTemplate(t)),
      goalFunds: [...p.goalFunds, ...convertedEmergencyGoals].map((g) => ({
        id: g.id,
        name: g.name,
        targetAmount: Money.fromCents(g.targetAmountCents),
        currentBalance: Money.fromCents(g.currentBalanceCents),
        expectedAnnualReturn: RateBps.fromBasisPoints(g.expectedAnnualReturnBps),
        monthlyContribution: Money.fromCents(g.monthlyContributionCents),
        startDateIso: g.startDateIso,
        targetDateIso: g.targetDateIso,
      })),
      debts: p.debts.map((d) => ({
        id: d.id,
        name: d.name,
        currentBalance: Money.fromCents(d.currentBalanceCents),
        annualApr: RateBps.fromBasisPoints(d.annualAprBps),
        startDateIso: d.startDateIso,
        payoffPlan:
          d.payoffPlan.kind === "monthlyPayment"
            ? { kind: "monthlyPayment", monthlyPayment: Money.fromCents(d.payoffPlan.monthlyPaymentCents) }
            : { kind: "targetDate", targetPayoffDateIso: d.payoffPlan.targetPayoffDateIso },
      })),
      ceilingRedirectRules: p.ceilingRedirectRules.map((r) => ({
        id: r.id,
        sourceKind: r.sourceKind,
        sourceId: r.sourceId,
        destinationKind: r.destinationKind,
        destinationId: r.destinationId,
      })),
    };
  }

  private toPersistedMember(m: HouseholdMember): PersistedHouseholdMember {
    return {
      id: m.id,
      displayName: m.displayName,
      employmentIncomeAnnualCents: m.employmentIncomeAnnual.getCents(),
      tfsaRoomEntries: m.tfsaRoomEntries.map((e) => this.toPersistedTfsaEntry(e)),
      rrspContributionRoomAnnualCents: m.rrspContributionRoomAnnual.getCents(),
    };
  }

  private fromPersistedMember(m: PersistedHouseholdMember): HouseholdMember {
    return {
      id: m.id,
      displayName: m.displayName,
      employmentIncomeAnnual: Money.fromCents(m.employmentIncomeAnnualCents),
      tfsaRoomEntries: m.tfsaRoomEntries.map((e) => this.fromPersistedTfsaEntry(e)),
      rrspContributionRoomAnnual: Money.fromCents(m.rrspContributionRoomAnnualCents),
    };
  }

  private toPersistedHousehold(h: HouseholdBudget): PersistedHouseholdBudget {
    return {
      allocatedMonthlyCents: h.allocatedMonthly.getCents(),
      categories: h.categories.map((c) => this.toPersistedHouseholdCategory(c)),
    };
  }

  private fromPersistedHousehold(h: PersistedHouseholdBudget): HouseholdBudget {
    return {
      allocatedMonthly: Money.fromCents(h.allocatedMonthlyCents),
      categories: h.categories.map((c) => this.fromPersistedHouseholdCategory(c)),
    };
  }

  private toPersistedHouseholdCategory(
    c: HouseholdExpenseCategory,
  ): PersistedHouseholdExpenseCategory {
    return { id: c.id, name: c.name, monthlyAmountCents: c.monthlyAmount.getCents() };
  }

  private fromPersistedHouseholdCategory(
    c: PersistedHouseholdExpenseCategory,
  ): HouseholdExpenseCategory {
    return { id: c.id, name: c.name, monthlyAmount: Money.fromCents(c.monthlyAmountCents) };
  }

  private toPersistedInvestmentBucketV2(b: InvestmentBucket): PersistedInvestmentBucketV2 {
    return {
      id: b.id,
      kind: b.kind,
      name: b.name,
      ownerMemberId: b.ownerMemberId,
      startingBalanceCents: b.startingBalance.getCents(),
      monthlyContributionCents: b.monthlyContribution.getCents(),
      isRecurringMonthly: b.isRecurringMonthly,
      expectedAnnualReturnBps: b.expectedAnnualReturn.getBasisPoints(),
      startDateIso: b.startDateIso,
      backfillContributions: b.backfillContributions.map((e) => ({
        year: e.year,
        amountCents: e.amount.getCents(),
      })),
      oneTimeContributionCents: 0,
    };
  }

  private fromPersistedInvestmentBucketV2(b: PersistedInvestmentBucketV2, taxYear: number): InvestmentBucket {
    if (b.kind === "EmergencyCash") {
      throw new Error("EmergencyCash investment buckets are migrated to goal funds.");
    }

    const backfill =
      b.backfillContributions?.map((e) => ({ year: e.year, amount: Money.fromCents(e.amountCents) })) ??
      (b.oneTimeContributionCents && b.oneTimeContributionCents > 0
        ? [{ year: taxYear, amount: Money.fromCents(b.oneTimeContributionCents) }]
        : []);

    return {
      id: b.id,
      kind: b.kind,
      name: b.name,
      ownerMemberId: b.ownerMemberId,
      startingBalance: Money.fromCents(b.startingBalanceCents),
      monthlyContribution: Money.fromCents(b.monthlyContributionCents),
      startDateIso: b.startDateIso,
      isRecurringMonthly: b.isRecurringMonthly,
      expectedAnnualReturn: RateBps.fromBasisPoints(b.expectedAnnualReturnBps),
      backfillContributions: backfill,
    };
  }

  private toPersistedTfsaEntry(e: TfsaRoomEntry): PersistedTfsaRoomEntry {
    return { year: e.year, roomCents: e.room.getCents() };
  }

  private fromPersistedTfsaEntry(e: PersistedTfsaRoomEntry): TfsaRoomEntry {
    return { year: e.year, room: Money.fromCents(e.roomCents) };
  }

  private toPersistedTemplate(t: TemplateAllocation): PersistedTemplateAllocation {
    return {
      id: t.id,
      kind: t.kind,
      name: t.name,
      monthlyAllocationCents: t.monthlyAllocation.getCents(),
      expectedAnnualReturnBps: t.expectedAnnualReturn.getBasisPoints(),
    };
  }

  private fromPersistedTemplate(t: PersistedTemplateAllocation): TemplateAllocation {
    return {
      id: t.id,
      kind: t.kind,
      name: t.name,
      monthlyAllocation: Money.fromCents(t.monthlyAllocationCents),
      expectedAnnualReturn: RateBps.fromBasisPoints(t.expectedAnnualReturnBps),
    };
  }

  private migrateV1ToV2(v1: PersistedSnapshotV1): PersistedSnapshotV2 {
    const migrateSession = (s: PersistedBudgetSessionV1): PersistedBudgetSessionV2 => {
      const memberId = IdentifierFactory.create();

      const tfsaRoomEntries: PersistedTfsaRoomEntry[] = [];
      for (const b of s.investments) {
        if (b.kind !== "TFSA") continue;
        for (const e of b.tfsaRoomEntries ?? []) tfsaRoomEntries.push(e);
      }

      const rrspRoomCents =
        s.investments.find((b) => b.kind === "RRSP")?.rrspContributionRoomCents ?? 0;

      const members: PersistedHouseholdMember[] = [
        {
          id: memberId,
          displayName: "You",
          employmentIncomeAnnualCents: s.grossHouseholdIncomeAnnualCents,
          tfsaRoomEntries,
          rrspContributionRoomAnnualCents: rrspRoomCents,
        },
      ];

      const investments: PersistedInvestmentBucketV2[] = s.investments.map((b) => ({
        id: b.id,
        kind: b.kind,
        name: b.name,
        ownerMemberId: b.kind === "TFSA" || b.kind === "RRSP" ? memberId : undefined,
        startingBalanceCents: b.startingBalanceCents,
        monthlyContributionCents: b.monthlyContributionCents,
        oneTimeContributionCents: b.oneTimeContributionCents,
        isRecurringMonthly: b.isRecurringMonthly,
        expectedAnnualReturnBps: b.expectedAnnualReturnBps,
      }));

      return {
        id: s.id,
        locale: s.locale,
        members,
        assumedAnnualInflationBps: s.assumedAnnualInflationBps,
        projectionHorizonYears: s.projectionHorizonYears,
        household: s.household,
        investments,
        templates: s.templates,
        luxuryMonthlyCents: s.luxuryMonthlyCents,
        cashSavingsMonthlyCents: s.cashSavingsMonthlyCents,
      };
    };

    return {
      version: 2,
      originalSession: migrateSession(v1.originalSession),
      currentSession: migrateSession(v1.currentSession),
    };
  }

  private migrateV2ToV3(v2: PersistedSnapshotV2): PersistedSnapshotV3 {
    const migrateSession = (s: PersistedBudgetSessionV2): PersistedBudgetSessionV3 => {
      const goalFunds: PersistedGoalFund[] = [];

      if (s.cashSavingsMonthlyCents > 0) {
        goalFunds.push({
          id: IdentifierFactory.create(),
          name: "Emergency fund",
          targetAmountCents: 0,
          currentBalanceCents: 0,
          expectedAnnualReturnBps: 300,
          monthlyContributionCents: s.cashSavingsMonthlyCents,
        });
      }

      if (s.luxuryMonthlyCents > 0) {
        goalFunds.push({
          id: IdentifierFactory.create(),
          name: "Vacation (Japan)",
          targetAmountCents: 0,
          currentBalanceCents: 0,
          expectedAnnualReturnBps: 0,
          monthlyContributionCents: s.luxuryMonthlyCents,
        });
      }

      // If v2 had an EmergencyCash investment bucket, migrate it into a goal fund.
      const emergencyBuckets = s.investments.filter((b) => b.kind === "EmergencyCash");
      for (const b of emergencyBuckets) {
        goalFunds.push({
          id: IdentifierFactory.create(),
          name: b.name?.trim().length ? b.name : "Emergency fund",
          targetAmountCents: 0,
          currentBalanceCents: b.startingBalanceCents,
          expectedAnnualReturnBps: b.expectedAnnualReturnBps,
          monthlyContributionCents: b.monthlyContributionCents,
        });
      }

      return {
        id: s.id,
        locale: s.locale,
        members: s.members,
        assumedAnnualInflationBps: s.assumedAnnualInflationBps,
        projectionHorizonYears: s.projectionHorizonYears,
        household: s.household,
        investments: s.investments.filter((b) => b.kind !== "EmergencyCash"),
        templates: s.templates,
        goalFunds,
        debts: [],
        ceilingRedirectRules: [],
      };
    };

    return {
      version: 3,
      originalSession: migrateSession(v2.originalSession),
      currentSession: migrateSession(v2.currentSession),
    };
  }
}

