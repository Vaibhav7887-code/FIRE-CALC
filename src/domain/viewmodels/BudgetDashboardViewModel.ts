import { BudgetSession } from "@/domain/models/BudgetSession";
import { Money } from "@/domain/models/Money";
import { InvestmentProjectionManager } from "@/domain/managers/investments/InvestmentProjectionManager";
import { VariableContributionProjectionManager } from "@/domain/managers/investments/VariableContributionProjectionManager";
import { InflationManager } from "@/domain/managers/inflation/InflationManager";
import { HouseholdTaxEngineManager } from "@/domain/managers/tax/HouseholdTaxEngineManager";
import { GoalFundProjectionManager } from "@/domain/managers/goals/GoalFundProjectionManager";
import { DebtAmortizationManager } from "@/domain/managers/debts/DebtAmortizationManager";
import { DebtPaymentDrivenScheduleBuilder } from "@/domain/managers/debts/DebtPaymentDrivenScheduleBuilder";
import { CashflowTimelineManager } from "@/domain/managers/cashflow/CashflowTimelineManager";
import { DateMonthMath } from "@/domain/managers/debts/DateMonthMath";
import { CashflowTimeline } from "@/domain/managers/cashflow/CashflowTimelineModels";
import {
  AllocationSegment,
  AssumptionsSummary,
  BudgetDashboardViewData,
  DebtPayoffImpact,
  DebtRedirectTraceEntry,
  EarningsDecomposition,
  GoalRedirectImpact,
  GoalRedirectTraceEntry,
  NominalRealPoint,
  RedirectsAppliedTraceEntry,
  UpcomingDebt,
} from "@/domain/viewmodels/BudgetDashboardViewData";

class SegmentColorFactory {
  public static colorForKey(key: string): string {
    if (key === "household") return "bg-blue-500";
    if (key.startsWith("investment:")) return "bg-violet-500";
    if (key.startsWith("template:")) return "bg-amber-500";
    if (key.startsWith("goalFund:")) return "bg-emerald-500";
    if (key.startsWith("debt:")) return "bg-red-500";
    if (key === "unallocated") return "bg-slate-300";
    return "bg-slate-400";
  }
}

export class BudgetDashboardViewModel {
  private readonly householdTaxEngine: HouseholdTaxEngineManager;
  private readonly projectionManager: InvestmentProjectionManager;
  private readonly variableProjection: VariableContributionProjectionManager;
  private readonly inflationManager: InflationManager;
  private readonly goalProjection: GoalFundProjectionManager;
  private readonly debtAmortization: DebtAmortizationManager;
  private readonly debtPaymentDriven: DebtPaymentDrivenScheduleBuilder;
  private readonly cashflowTimeline: CashflowTimelineManager;

  public constructor(
    householdTaxEngine: HouseholdTaxEngineManager = new HouseholdTaxEngineManager(),
    projectionManager: InvestmentProjectionManager = new InvestmentProjectionManager(),
    variableProjection: VariableContributionProjectionManager = new VariableContributionProjectionManager(),
    inflationManager: InflationManager = new InflationManager(),
    goalProjection: GoalFundProjectionManager = new GoalFundProjectionManager(),
    debtAmortization: DebtAmortizationManager = new DebtAmortizationManager(),
    debtPaymentDriven: DebtPaymentDrivenScheduleBuilder = new DebtPaymentDrivenScheduleBuilder(),
    cashflowTimeline: CashflowTimelineManager = new CashflowTimelineManager(),
  ) {
    this.householdTaxEngine = householdTaxEngine;
    this.projectionManager = projectionManager;
    this.variableProjection = variableProjection;
    this.inflationManager = inflationManager;
    this.goalProjection = goalProjection;
    this.debtAmortization = debtAmortization;
    this.debtPaymentDriven = debtPaymentDriven;
    this.cashflowTimeline = cashflowTimeline;
  }

  public build(session: BudgetSession): BudgetDashboardViewData {
    const householdTax = this.householdTaxEngine.estimate(session);
    const netMonthly = householdTax.netIncomeMonthly;
    const memberNetIncomeMonthly = householdTax.members.map((m) => ({
      memberId: m.memberId,
      displayName: m.displayName,
      netIncomeMonthly: m.tax.netIncomeMonthly,
    }));

    const { segments, upcomingDebts } = this.buildSegments(session, netMonthly);
    const netCents = netMonthly.getCents();
    const allocatedCents = segments
      .filter((s) => s.key !== "unallocated")
      .reduce((sum, s) => sum + s.cents, 0);
    const isOverAllocated = allocatedCents > netCents;
    const shortfallCents = Math.max(0, allocatedCents - netCents);
    const sliderTotalCents = Math.max(netCents, allocatedCents);

    const withRedirects = this.cashflowTimeline.build(session);
    const baseline = this.cashflowTimeline.build({ ...session, ceilingRedirectRules: [] });

    const { nominalSeries, earnings } = this.buildTotalInvestmentSeries(session, withRedirects.timeline);
    const adjusted = this.inflationManager.adjustMonthlySeriesToReal(
      nominalSeries.map((p) => ({ monthIndex: p.monthIndex, totalValue: Money.fromCents(p.nominalCents) })),
      session.assumedAnnualInflation,
    );

    const nominalVsRealSeries: NominalRealPoint[] = adjusted.map((p) => ({
      monthIndex: p.monthIndex,
      nominalCents: p.nominal.getCents(),
      realCents: p.real.getCents(),
    }));

    const nowIso = DateMonthMath.currentMonthIso();

    const goalFundBalanceSeries = session.goalFunds.map((g) => {
      const scheduleNow =
        withRedirects.timeline.goalFundSeries.find((s) => s.id === g.id)?.monthlyCents ?? [];
      const projected = this.variableProjection.project({
        name: g.name,
        startingBalance: g.currentBalance,
        expectedAnnualReturn: g.expectedAnnualReturn,
        monthlyContributionsCents: scheduleNow,
      });

      return {
        fundId: g.id,
        name: g.name,
        startDateIso: g.startDateIso,
        startOffsetMonths:
          g.startDateIso && g.startDateIso.length > 0 ? DateMonthMath.monthsBetweenIso(nowIso, g.startDateIso) : 0,
        points: projected.points.map((p) => ({ monthIndex: p.monthIndex, cents: p.totalValue.getCents() })),
      };
    });

    const goalRedirectImpacts: GoalRedirectImpact[] = session.goalFunds.map((g) => {
      const scheduleNow =
        withRedirects.timeline.goalFundSeries.find((s) => s.id === g.id)?.monthlyCents ?? [];
      const scheduleWas =
        baseline.timeline.goalFundSeries.find((s) => s.id === g.id)?.monthlyCents ?? [];

      const seriesNow = this.variableProjection.project({
        name: g.name,
        startingBalance: g.currentBalance,
        expectedAnnualReturn: g.expectedAnnualReturn,
        monthlyContributionsCents: scheduleNow,
      });
      const seriesWas = this.variableProjection.project({
        name: g.name,
        startingBalance: g.currentBalance,
        expectedAnnualReturn: g.expectedAnnualReturn,
        monthlyContributionsCents: scheduleWas,
      });

      const targetCents = Math.max(0, g.targetAmount.getCents());
      const findReached = (points: ReadonlyArray<{ monthIndex: number; cents: number }>) => {
        if (targetCents <= 0) return null;
        const hit = points.find((p) => p.cents >= targetCents);
        return hit ? hit.monthIndex : null;
      };

      const pointsNow = seriesNow.points.map((p) => ({ monthIndex: p.monthIndex, cents: p.totalValue.getCents() }));
      const pointsWas = seriesWas.points.map((p) => ({ monthIndex: p.monthIndex, cents: p.totalValue.getCents() }));

      const reachedNow = findReached(pointsNow);
      const reachedWas = findReached(pointsWas);

      const reachedNowLabel =
        reachedNow === null ? "Not reached (within horizon)" : DateMonthMath.formatMonYYYY(DateMonthMath.addMonthsIso(nowIso, reachedNow));
      const reachedWasLabel =
        reachedWas === null ? "Not reached (within horizon)" : DateMonthMath.formatMonYYYY(DateMonthMath.addMonthsIso(nowIso, reachedWas));

      const redirectTrace: GoalRedirectTraceEntry[] = withRedirects.redirectsApplied
        .filter((a) => a.destinationKind === "GoalFund" && a.destinationId === g.id && a.appliedCents > 0)
        .map((a) => {
          const monthIso = DateMonthMath.addMonthsIso(nowIso, a.monthIndex);
          return {
            monthIndex: a.monthIndex,
            monthLabel: DateMonthMath.formatMonYYYY(monthIso),
            amountCents: a.appliedCents,
            sourceLabel: this.redirectSourceLabel(session, a.sourceKind, a.sourceId),
          };
        });

      return {
        fundId: g.id,
        name: g.name,
        targetReachedWasMonthIndex: reachedWas,
        targetReachedNowMonthIndex: reachedNow,
        targetReachedWasLabel: reachedWasLabel,
        targetReachedNowLabel: reachedNowLabel,
        redirectTrace,
      };
    });

    const redirectsAppliedTrace: RedirectsAppliedTraceEntry[] = withRedirects.redirectsApplied
      .filter((a) => a.appliedCents > 0)
      .map((a) => {
        const monthIso = DateMonthMath.addMonthsIso(nowIso, a.monthIndex);
        return {
          monthIndex: a.monthIndex,
          monthLabel: DateMonthMath.formatMonYYYY(monthIso),
          amountCents: a.appliedCents,
          sourceLabel: this.redirectSourceLabel(session, a.sourceKind, a.sourceId),
          destinationLabel: this.redirectDestinationLabel(session, a.destinationKind, a.destinationId),
        };
      });

    const debtBalanceSeries = session.debts.map((d) => {
      const payments = withRedirects.timeline.debtSeries.find((s) => s.id === d.id)?.monthlyCents ?? [];
      const schedule = this.debtPaymentDriven.build(d, session.projectionHorizonYears, payments, { timelineStartIso: nowIso });
      return {
        debtId: d.id,
        name: d.name,
        points: schedule.points.map((p) => ({ monthIndex: p.monthIndex, cents: -p.endingBalance.getCents() })),
      };
    });

    const debtPayoffImpacts: DebtPayoffImpact[] = session.debts.map((d) => {
      const paymentsNow = withRedirects.timeline.debtSeries.find((s) => s.id === d.id)?.monthlyCents ?? [];
      const paymentsWas = baseline.timeline.debtSeries.find((s) => s.id === d.id)?.monthlyCents ?? [];

      const scheduleNow = this.debtPaymentDriven.build(d, session.projectionHorizonYears, paymentsNow, { timelineStartIso: nowIso });
      const scheduleWas = this.debtPaymentDriven.build(d, session.projectionHorizonYears, paymentsWas, { timelineStartIso: nowIso });

      const payoffNowLabel = this.payoffLabel(nowIso, scheduleNow.payoffMonthIndex);
      const payoffWasLabel = this.payoffLabel(nowIso, scheduleWas.payoffMonthIndex);

      const redirectTrace: DebtRedirectTraceEntry[] = withRedirects.redirectsApplied
        .filter((a) => a.destinationKind === "DebtLoan" && a.destinationId === d.id && a.appliedCents > 0)
        .map((a) => {
          const monthIso = DateMonthMath.addMonthsIso(nowIso, a.monthIndex);
          return {
            monthIndex: a.monthIndex,
            monthLabel: DateMonthMath.formatMonYYYY(monthIso),
            amountCents: a.appliedCents,
            sourceLabel: this.redirectSourceLabel(session, a.sourceKind, a.sourceId),
          };
        });

      return {
        debtId: d.id,
        name: d.name,
        payoffWasMonthIndex: scheduleWas.payoffMonthIndex,
        payoffNowMonthIndex: scheduleNow.payoffMonthIndex,
        payoffWasLabel,
        payoffNowLabel,
        redirectTrace,
      };
    });

    const assumptions: AssumptionsSummary = {
      taxYear: session.locale.taxYear,
      assumedInflationPercent: session.assumedAnnualInflation.toPercent(),
      projectionHorizonYears: session.projectionHorizonYears,
    };

    return {
      netIncomeMonthly: netMonthly,
      memberNetIncomeMonthly,
      sliderTotalCents,
      isOverAllocated,
      shortfallCents,
      segments,
      upcomingDebts,
      assumptions,
      nominalVsRealSeries,
      earningsDecomposition: earnings,
      goalFundBalanceSeries,
      goalRedirectImpacts,
      redirectsAppliedTrace,
      debtBalanceSeries,
      debtPayoffImpacts,
    };
  }

  private redirectDestinationLabel(
    session: BudgetSession,
    destinationKind: "GoalFund" | "InvestmentBucket" | "DebtLoan" | "Unallocated",
    destinationId?: string,
  ): string {
    if (destinationKind === "Unallocated") return "Unallocated";
    if (!destinationId) return destinationKind;

    if (destinationKind === "GoalFund") {
      const g = session.goalFunds.find((x) => x.id === destinationId);
      return g ? `Goal: ${g.name}` : "Goal (unknown)";
    }

    if (destinationKind === "DebtLoan") {
      const d = session.debts.find((x) => x.id === destinationId);
      return d ? `Debt: ${d.name}` : "Debt (unknown)";
    }

    const b = session.investments.find((x) => x.id === destinationId);
    return b ? `Investment: ${b.name}` : "Investment (unknown)";
  }

  private payoffLabel(timelineStartIso: string, payoffMonthIndex: number | null): string {
    if (payoffMonthIndex === null) return "Not paid off (within horizon)";
    const iso = DateMonthMath.addMonthsIso(timelineStartIso, payoffMonthIndex);
    return DateMonthMath.formatMonYYYY(iso);
  }

  private redirectSourceLabel(
    session: BudgetSession,
    sourceKind: "GoalFund" | "DebtLoan" | "RegisteredRoomCeiling",
    sourceId: string,
  ): string {
    if (sourceKind === "GoalFund") return `Goal: ${session.goalFunds.find((g) => g.id === sourceId)?.name ?? "Goal"}`;
    if (sourceKind === "DebtLoan") return `Debt: ${session.debts.find((d) => d.id === sourceId)?.name ?? "Debt"}`;
    const inv = session.investments.find((b) => b.id === sourceId);
    return `Room: ${inv?.name ?? "Registered account"}`;
  }

  private buildSegments(
    session: BudgetSession,
    netIncomeMonthly: Money,
  ): Readonly<{ segments: AllocationSegment[]; upcomingDebts: BudgetDashboardViewData["upcomingDebts"] }> {
    const segments: AllocationSegment[] = [];
    const upcomingDebts: UpcomingDebt[] = [];
    const nowIso = DateMonthMath.currentMonthIso();

    segments.push(this.segment("household", "Household", session.household.allocatedMonthly.getCents()));

    for (const b of session.investments) {
      const plannedCents = b.isRecurringMonthly ? b.monthlyContribution.getCents() : 0;
      segments.push(
        this.segment(`investment:${b.id}`, b.name, plannedCents),
      );
    }

    for (const t of session.templates) {
      segments.push(
        this.segment(`template:${t.id}`, t.name, t.monthlyAllocation.getCents()),
      );
    }

    for (const g of session.goalFunds) {
      segments.push(
        this.segment(`goalFund:${g.id}`, g.name, g.monthlyContribution.getCents()),
      );
    }

    for (const d of session.debts) {
      const paymentCents = this.debtAmortization.computeMonthlyPaymentFromDebt(d).getCents();
      const isLocked = d.payoffPlan.kind === "targetDate";
      const startIso = d.startDateIso && d.startDateIso.length > 0 ? d.startDateIso : "";
      let isUpcoming = false;
      try {
        isUpcoming = startIso.length > 0 && DateMonthMath.monthsBetweenIso(nowIso, startIso) > 0;
      } catch {
        isUpcoming = false;
      }

      if (isUpcoming) {
        upcomingDebts.push({
          debtId: d.id,
          name: d.name,
          startDateIso: startIso,
          plannedPaymentCents: Math.max(0, Math.round(paymentCents)),
        });
        segments.push(this.segment(`debt:${d.id}`, d.name, 0, { isLocked }));
      } else {
        segments.push(this.segment(`debt:${d.id}`, d.name, paymentCents, { isLocked }));
      }
    }

    const allocatedCents = segments.reduce((sum, s) => sum + s.cents, 0);
    const unallocatedCents = Math.max(0, netIncomeMonthly.getCents() - allocatedCents);
    segments.push(this.segment("unallocated", "Unallocated", unallocatedCents));

    return { segments, upcomingDebts };
  }

  private segment(
    key: string,
    label: string,
    cents: number,
    opts?: Readonly<{ isLocked?: boolean }>,
  ): AllocationSegment {
    return {
      key: key as any,
      label,
      cents: Math.max(0, Math.round(cents)),
      colorClass: SegmentColorFactory.colorForKey(key),
      isLocked: opts?.isLocked ?? false,
    };
  }

  private buildTotalInvestmentSeries(
    session: BudgetSession,
    timeline: CashflowTimeline,
  ): Readonly<{ nominalSeries: ReadonlyArray<NominalRealPoint>; earnings: EarningsDecomposition }> {

    const bucketSeries = [
      ...session.investments.map((b) => {
        const schedule = timeline.investmentSeries.find((s) => s.id === b.id)?.monthlyCents ?? [];
        return this.variableProjection.project({
          name: b.name,
          startingBalance: b.startingBalance,
          expectedAnnualReturn: b.expectedAnnualReturn,
          monthlyContributionsCents: schedule,
        });
      }),
      ...session.templates.map((t) => {
        const schedule = timeline.templateSeries.find((s) => s.id === t.id)?.monthlyCents ?? [];
        return this.variableProjection.project({
          name: t.name,
          startingBalance: Money.zero(),
          expectedAnnualReturn: t.expectedAnnualReturn,
          monthlyContributionsCents: schedule,
        });
      }),
    ];

    const maxPoints = Math.max(...bucketSeries.map((s) => s.points.length));
    const points: NominalRealPoint[] = [];

    for (let i = 0; i < maxPoints; i++) {
      const monthIndex = bucketSeries[0]?.points[i]?.monthIndex ?? i;
      const nominalCents = bucketSeries.reduce(
        (sum, s) => sum + (s.points[i]?.totalValue.getCents() ?? 0),
        0,
      );
      points.push({ monthIndex, nominalCents, realCents: nominalCents });
    }

    const endingPrincipalCents = bucketSeries.reduce((sum, s) => sum + s.endingPrincipal.getCents(), 0);
    const endingSimpleTotalCents = bucketSeries.reduce(
      (sum, s) => sum + s.endingSimpleInterestValue.getCents(),
      0,
    );
    const endingCompoundTotalCents = bucketSeries.reduce((sum, s) => sum + s.endingValue.getCents(), 0);

    const earnings: EarningsDecomposition = {
      principalCents: endingPrincipalCents,
      simpleInterestTotalCents: endingSimpleTotalCents,
      compoundTotalCents: endingCompoundTotalCents,
      compoundDeltaCents: endingCompoundTotalCents - endingSimpleTotalCents,
    };

    return { nominalSeries: points, earnings };
  }

  // RRSP ownership/room is handled in HouseholdTaxEngineManager.
}

