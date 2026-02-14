import { BudgetSession } from "@/domain/models/BudgetSession";
import { CeilingRedirectRule } from "@/domain/models/CeilingRedirectRule";
import { GoalFund } from "@/domain/models/GoalFund";
import { DebtLoan } from "@/domain/models/DebtLoan";
import { InvestmentBucket } from "@/domain/models/InvestmentBucket";
import { TemplateAllocation } from "@/domain/models/BudgetSession";
import { GoalFundProjectionManager } from "@/domain/managers/goals/GoalFundProjectionManager";
import { DebtAmortizationManager } from "@/domain/managers/debts/DebtAmortizationManager";
import { DateMonthMath } from "@/domain/managers/debts/DateMonthMath";
import { RegisteredRoomManager } from "@/domain/managers/registered/RegisteredRoomManager";
import {
  CashflowTimelineResult,
  CeilingFreeCentsEvent,
  CashflowTimeline,
  RedirectApplication,
  TimelineSeries,
} from "@/domain/managers/cashflow/CashflowTimelineModels";
import { CeilingRedirectManager } from "@/domain/managers/cashflow/CeilingRedirectManager";

type MutableSeries = {
  id: string;
  name: string;
  monthlyCents: number[];
};

type DebtRunningState = {
  startOffset: number;
  startingBalanceCents: number;
  monthlyRate: number;
  scheduledPaymentCents: number;
  hasOriginated: boolean;
  balanceCents: number;
};

type DebtMonthContext = {
  debtId: string;
  hasOriginated: boolean;
  remainingDueCents: number;
  appliedTotalCents: number;
};

export class CashflowTimelineManager {
  private readonly goalProjection: GoalFundProjectionManager;
  private readonly debtAmortization: DebtAmortizationManager;
  private readonly roomManager: RegisteredRoomManager;
  private readonly redirectManager: CeilingRedirectManager;

  public constructor(
    goalProjection: GoalFundProjectionManager = new GoalFundProjectionManager(),
    debtAmortization: DebtAmortizationManager = new DebtAmortizationManager(),
    roomManager: RegisteredRoomManager = new RegisteredRoomManager(),
    redirectManager: CeilingRedirectManager = new CeilingRedirectManager(),
  ) {
    this.goalProjection = goalProjection;
    this.debtAmortization = debtAmortization;
    this.roomManager = roomManager;
    this.redirectManager = redirectManager;
  }

  public build(session: BudgetSession): CashflowTimelineResult {
    const months = Math.max(0, Math.round(session.projectionHorizonYears * 12));
    const timelineStartIso = DateMonthMath.currentMonthIso();

    const investments = session.investments.map((b) => this.buildInvestmentBaseSeries(b, months, timelineStartIso));
    const templates = session.templates.map((t) => this.buildTemplateBaseSeries(t, months));
    const goals = session.goalFunds.map((g) =>
      this.buildGoalBaseSeries(g, session.projectionHorizonYears, months, timelineStartIso),
    );
    const debts = session.debts.map((d) =>
      this.buildDebtBaseSeries(d, session.projectionHorizonYears, months, timelineStartIso),
    );

    const resolver = {
      goalFundIds: new Set(session.goalFunds.map((g) => g.id)),
      investmentBucketIds: new Set(session.investments.map((b) => b.id)),
      debtIds: new Set(session.debts.map((d) => d.id)),
    };

    const redirectsApplied: RedirectApplication[] = [];
    const unallocated: number[] = Array.from({ length: months + 1 }, () => 0);

    const registeredRoomPools = this.buildRegisteredRoomPools(session);

    const debtStates: Record<string, DebtRunningState> = {};
    for (const debt of session.debts) {
      const startOffset =
        debt.startDateIso && debt.startDateIso.length > 0
          ? DateMonthMath.monthsBetweenIso(timelineStartIso, debt.startDateIso)
          : 0;
      const scheduledPaymentCents = Math.max(0, this.debtAmortization.computeMonthlyPaymentFromDebt(debt).getCents());
      const startingBalanceCents = Math.max(0, debt.currentBalance.getCents());
      // Keep monthly rate semantics aligned with the schedule builder (annualAprDecimal / 12, rounded interest cents).
      const monthlyRate = debt.annualApr.toDecimal() / 12;

      debtStates[debt.id] = {
        startOffset,
        startingBalanceCents,
        monthlyRate: Number.isFinite(monthlyRate) ? monthlyRate : 0,
        scheduledPaymentCents,
        hasOriginated: startOffset === 0,
        balanceCents: startOffset === 0 ? startingBalanceCents : 0,
      };
    }

    for (let m = 0; m <= months; m++) {
      // Debt month contexts: compute interest + scheduled payment first, then apply redirect payments as they arrive.
      // This ensures redirect-to-debt is an extra payment in the same month (after interest, after scheduled).
      const debtMonth: Record<string, DebtMonthContext> = {};
      const debtScheduledFreed: Array<{ debtId: string; freedCents: number }> = [];

      for (const d of debts) {
        const state = debtStates[d.id];
        if (!state) continue;

        if (!state.hasOriginated && m === state.startOffset) {
          state.hasOriginated = true;
          state.balanceCents = state.startingBalanceCents;
        }

        const basePlanned = m < state.startOffset ? 0 : state.scheduledPaymentCents;
        const interestCents = state.hasOriginated ? Math.round(state.balanceCents * state.monthlyRate) : 0;
        const dueCents = state.hasOriginated ? Math.max(0, state.balanceCents + interestCents) : 0;
        const scheduledApplied = state.hasOriginated ? Math.min(basePlanned, dueCents) : 0;
        const scheduledFreed = Math.max(0, basePlanned - scheduledApplied);

        debtMonth[d.id] = {
          debtId: d.id,
          hasOriginated: state.hasOriginated,
          remainingDueCents: Math.max(0, dueCents - scheduledApplied),
          appliedTotalCents: scheduledApplied,
        };

        if (scheduledFreed > 0) debtScheduledFreed.push({ debtId: d.id, freedCents: scheduledFreed });
      }

      // Apply debt "scheduled freed" redirects after all contexts exist (supports debt->debt in the same month).
      for (const e of debtScheduledFreed) {
        this.applyRedirect(
          { monthIndex: m, sourceKind: "DebtLoan", sourceId: e.debtId, freedCents: e.freedCents },
          session.ceilingRedirectRules,
          resolver,
          investments,
          goals,
          debts,
          unallocated,
          redirectsApplied,
          debtMonth,
        );
      }

      // Resolve non-debt ceilings iteratively (redirects can add to goals/investments which can then be capped).
      const roomStartingThisMonth: Record<string, number> = { ...registeredRoomPools };
      let guard = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        guard++;
        let changed = false;

        // Goal ceilings: allow partial final month contribution; redirect freed remainder.
        for (const g of goals) {
          const planned = g.monthlyCents[m] ?? 0;
          const actual = this.actualGoalContributionThisMonth(session, timelineStartIso, g.id, planned, m);
          if (actual !== planned) {
            g.monthlyCents[m] = actual;
            const freed = Math.max(0, planned - actual);
            this.applyRedirect(
              { monthIndex: m, sourceKind: "GoalFund", sourceId: g.id, freedCents: freed },
              session.ceilingRedirectRules,
              resolver,
              investments,
              goals,
              debts,
              unallocated,
              redirectsApplied,
              debtMonth,
            );
            changed = true;
          }
        }

        // Registered room ceilings (per bucket): cap TFSA/RRSP monthly contributions by remaining room.
        // Recompute from the same month-start pools each iteration for determinism.
        const roomRemaining: Record<string, number> = { ...roomStartingThisMonth };

        for (const inv of investments) {
          const bucket = session.investments.find((b) => b.id === inv.id);
          if (!bucket) continue;
          if (bucket.kind !== "TFSA" && bucket.kind !== "RRSP") continue;
          if (!bucket.ownerMemberId) continue;

          const planned = inv.monthlyCents[m] ?? 0;
          if (planned <= 0) continue;

          const poolKey = this.poolKey(bucket.ownerMemberId, bucket.kind);
          const remaining = roomRemaining[poolKey] ?? 0;
          const actual = Math.min(planned, Math.max(0, remaining));
          if (actual !== planned) {
            inv.monthlyCents[m] = actual;
            const freed = Math.max(0, planned - actual);
            this.applyRedirect(
              { monthIndex: m, sourceKind: "RegisteredRoomCeiling", sourceId: inv.id, freedCents: freed },
              session.ceilingRedirectRules,
              resolver,
              investments,
              goals,
              debts,
              unallocated,
              redirectsApplied,
              debtMonth,
            );
            changed = true;
          }
          roomRemaining[poolKey] = Math.max(0, remaining - actual);
        }

        if (!changed || guard >= 10) {
          // Commit this month's remaining room to the outer pool for next month.
          Object.keys(registeredRoomPools).forEach((k) => {
            registeredRoomPools[k] = roomRemaining[k] ?? registeredRoomPools[k] ?? 0;
          });
          break;
        }
      }

      // Finalize debt payments for this month: apply remaining redirect cents are handled inline by applyRedirect.
      for (const d of debts) {
        const state = debtStates[d.id];
        const ctx = debtMonth[d.id];
        if (!state || !ctx) continue;

        // Enforce that pre-start debts cannot be pre-paid: if not originated, no payment is applied.
        const actualPayment = ctx.hasOriginated ? ctx.appliedTotalCents : 0;
        d.monthlyCents[m] = actualPayment;

        if (ctx.hasOriginated) {
          // End-of-month: remaining due becomes next month's opening balance.
          state.balanceCents = Math.max(0, ctx.remainingDueCents);
        } else {
          state.balanceCents = 0;
        }
      }

    }

    const timeline: CashflowTimeline = {
      months,
      investmentSeries: investments.map((s) => ({ id: s.id, name: s.name, monthlyCents: s.monthlyCents })),
      templateSeries: templates.map((s) => ({ id: s.id, name: s.name, monthlyCents: s.monthlyCents })),
      goalFundSeries: goals.map((s) => ({ id: s.id, name: s.name, monthlyCents: s.monthlyCents })),
      debtSeries: debts.map((s) => ({ id: s.id, name: s.name, monthlyCents: s.monthlyCents })),
      unallocatedMonthlyCents: unallocated,
    };

    return { timeline, redirectsApplied };
  }

  private buildInvestmentBaseSeries(bucket: InvestmentBucket, months: number, timelineStartIso: string): MutableSeries {
    const planned = bucket.isRecurringMonthly ? bucket.monthlyContribution.getCents() : 0;
    const startIso = bucket.startDateIso;
    const startOffset =
      startIso && startIso.length > 0 ? DateMonthMath.monthsBetweenIso(timelineStartIso, startIso) : 0;
    return {
      id: bucket.id,
      name: bucket.name,
      monthlyCents: Array.from({ length: months + 1 }, (_, idx) => (idx < startOffset ? 0 : Math.max(0, planned))),
    };
  }

  private buildTemplateBaseSeries(template: TemplateAllocation, months: number): MutableSeries {
    const planned = template.monthlyAllocation.getCents();
    return {
      id: template.id,
      name: template.name,
      monthlyCents: Array.from({ length: months + 1 }, () => Math.max(0, planned)),
    };
  }

  private buildGoalBaseSeries(goal: GoalFund, horizonYears: number, months: number, timelineStartIso: string): MutableSeries {
    // Start with a flat planned schedule; ceilings will cap per month.
    const planned = goal.monthlyContribution.getCents();
    const startOffset =
      goal.startDateIso && goal.startDateIso.length > 0
        ? DateMonthMath.monthsBetweenIso(timelineStartIso, goal.startDateIso)
        : 0;
    const s: MutableSeries = {
      id: goal.id,
      name: goal.name,
      monthlyCents: Array.from(
        { length: months + 1 },
        (_, idx) => (idx < startOffset ? 0 : Math.max(0, planned)),
      ),
    };

    return s;
  }

  private buildDebtBaseSeries(debt: DebtLoan, horizonYears: number, months: number, timelineStartIso: string): MutableSeries {
    const startOffset =
      debt.startDateIso && debt.startDateIso.length > 0
        ? DateMonthMath.monthsBetweenIso(timelineStartIso, debt.startDateIso)
        : 0;

    const planned = this.debtAmortization.computeMonthlyPaymentFromDebt(debt).getCents();
    // A debt can have a smaller final payment; ceilings will cap per month.
    return {
      id: debt.id,
      name: debt.name,
      monthlyCents: Array.from(
        { length: months + 1 },
        (_, idx) => (idx < startOffset ? 0 : Math.max(0, planned)),
      ),
    };
  }

  private actualGoalContributionThisMonth(
    session: BudgetSession,
    timelineStartIso: string,
    goalId: string,
    plannedCents: number,
    monthIndex: number,
  ): number {
    const goal = session.goalFunds.find((g) => g.id === goalId);
    if (!goal) return plannedCents;
    if (plannedCents <= 0) return 0;

    const startOffset =
      goal.startDateIso && goal.startDateIso.length > 0
        ? DateMonthMath.monthsBetweenIso(timelineStartIso, goal.startDateIso)
        : 0;
    if (monthIndex < startOffset) return 0;

    const proj = this.goalProjection.project(goal, session.projectionHorizonYears, { timelineStartIso });
    const p = proj.points.find((x) => x.monthIndex === monthIndex);
    if (!p) return plannedCents;
    if (!goal.targetAmount.getCents()) return plannedCents;
    if (p.isTargetReached) return 0;

    // If this month would overshoot target, contribute only what's needed.
    const next = proj.points.find((x) => x.monthIndex === monthIndex + 1);
    if (!next) return plannedCents;
    const before = p.balance.getCents();
    const target = goal.targetAmount.getCents();
    if (before >= target) return 0;
    const needed = Math.max(0, target - before);
    return Math.min(plannedCents, needed);
  }

  private buildRegisteredRoomPools(session: BudgetSession): Record<string, number> {
    const pools: Record<string, number> = {};

    for (const member of session.members) {
      const summary = this.roomManager.buildForMember(session, member, session.locale.taxYear);

      // IMPORTANT: the timeline consumes room month-by-month, so pool capacity must NOT subtract recurring again.
      const tfsaCapacity = Math.max(0, summary.tfsaAccruedRoomCents - this.sumBackfillCents(session, member.id, "TFSA"));
      const rrspCapacity = Math.max(0, summary.rrspAccruedRoomCents - this.sumBackfillCents(session, member.id, "RRSP"));

      pools[this.poolKey(member.id, "TFSA")] = tfsaCapacity;
      pools[this.poolKey(member.id, "RRSP")] = rrspCapacity;
    }

    return pools;
  }

  private sumBackfillCents(session: BudgetSession, ownerMemberId: string, kind: "TFSA" | "RRSP"): number {
    return session.investments
      .filter((b) => b.kind === kind && b.ownerMemberId === ownerMemberId)
      .reduce((sum, b) => sum + (b.backfillContributions ?? []).reduce((s2, e) => s2 + e.amount.getCents(), 0), 0);
  }

  private poolKey(ownerMemberId: string, kind: "TFSA" | "RRSP"): string {
    return `${ownerMemberId}:${kind}`;
  }

  private applyRedirect(
    event: CeilingFreeCentsEvent,
    rules: ReadonlyArray<CeilingRedirectRule>,
    resolver: { goalFundIds: ReadonlySet<string>; investmentBucketIds: ReadonlySet<string>; debtIds: ReadonlySet<string> },
    investments: ReadonlyArray<MutableSeries>,
    goals: ReadonlyArray<MutableSeries>,
    debts: ReadonlyArray<MutableSeries>,
    unallocated: number[],
    redirectsApplied: RedirectApplication[],
    debtMonth: Record<string, DebtMonthContext>,
  ): void {
    if (event.freedCents <= 0) return;

    const applications = this.redirectManager.apply(event, rules, resolver);
    for (const a of applications) {
      if (a.destinationKind === "Unallocated" || !a.destinationId) {
        redirectsApplied.push(a);
        unallocated[event.monthIndex] = (unallocated[event.monthIndex] ?? 0) + a.appliedCents;
        continue;
      }

      if (a.destinationKind === "DebtLoan") {
        // Debt redirects are applied as extra payments in the same month (after interest, after scheduled).
        // They cannot pre-pay future-start debts; any non-applicable cents become unallocated for the month.
        const ctx = debtMonth[a.destinationId];
        if (!ctx || !ctx.hasOriginated) {
          const unallocApp: RedirectApplication = { ...a, destinationKind: "Unallocated", destinationId: undefined };
          redirectsApplied.push(unallocApp);
          unallocated[event.monthIndex] = (unallocated[event.monthIndex] ?? 0) + a.appliedCents;
          continue;
        }

        const applyCents = Math.min(a.appliedCents, Math.max(0, ctx.remainingDueCents));
        const remainderCents = Math.max(0, a.appliedCents - applyCents);

        if (applyCents > 0) {
          redirectsApplied.push({ ...a, appliedCents: applyCents });
          ctx.remainingDueCents = Math.max(0, ctx.remainingDueCents - applyCents);
          ctx.appliedTotalCents += applyCents;
        }

        if (remainderCents > 0) {
          redirectsApplied.push({
            ...a,
            destinationKind: "Unallocated",
            destinationId: undefined,
            appliedCents: remainderCents,
          });
          unallocated[event.monthIndex] = (unallocated[event.monthIndex] ?? 0) + remainderCents;
        }

        continue;
      }

      const list = a.destinationKind === "GoalFund" ? goals : investments;
      const target = list.find((s) => s.id === a.destinationId);
      if (!target) {
        const unallocApp: RedirectApplication = { ...a, destinationKind: "Unallocated", destinationId: undefined };
        redirectsApplied.push(unallocApp);
        unallocated[event.monthIndex] = (unallocated[event.monthIndex] ?? 0) + a.appliedCents;
        continue;
      }
      redirectsApplied.push(a);
      target.monthlyCents[event.monthIndex] = (target.monthlyCents[event.monthIndex] ?? 0) + a.appliedCents;
    }
  }

  // Note: debt APR monthly conversion is centralized in DebtAmortizationManager.
}

