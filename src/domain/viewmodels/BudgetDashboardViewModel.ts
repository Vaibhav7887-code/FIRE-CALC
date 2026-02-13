import { BudgetSession } from "@/domain/models/BudgetSession";
import { Money } from "@/domain/models/Money";
import { InvestmentProjectionManager } from "@/domain/managers/investments/InvestmentProjectionManager";
import { VariableContributionProjectionManager } from "@/domain/managers/investments/VariableContributionProjectionManager";
import { InflationManager } from "@/domain/managers/inflation/InflationManager";
import { HouseholdTaxEngineManager } from "@/domain/managers/tax/HouseholdTaxEngineManager";
import { GoalFundProjectionManager } from "@/domain/managers/goals/GoalFundProjectionManager";
import { DebtAmortizationManager } from "@/domain/managers/debts/DebtAmortizationManager";
import { CashflowTimelineManager } from "@/domain/managers/cashflow/CashflowTimelineManager";
import {
  AllocationSegment,
  BudgetDashboardViewData,
  EarningsDecomposition,
  NominalRealPoint,
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
  private readonly cashflowTimeline: CashflowTimelineManager;

  public constructor(
    householdTaxEngine: HouseholdTaxEngineManager = new HouseholdTaxEngineManager(),
    projectionManager: InvestmentProjectionManager = new InvestmentProjectionManager(),
    variableProjection: VariableContributionProjectionManager = new VariableContributionProjectionManager(),
    inflationManager: InflationManager = new InflationManager(),
    goalProjection: GoalFundProjectionManager = new GoalFundProjectionManager(),
    debtAmortization: DebtAmortizationManager = new DebtAmortizationManager(),
    cashflowTimeline: CashflowTimelineManager = new CashflowTimelineManager(),
  ) {
    this.householdTaxEngine = householdTaxEngine;
    this.projectionManager = projectionManager;
    this.variableProjection = variableProjection;
    this.inflationManager = inflationManager;
    this.goalProjection = goalProjection;
    this.debtAmortization = debtAmortization;
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

    const segments = this.buildSegments(session, netMonthly);
    const netCents = netMonthly.getCents();
    const allocatedCents = segments
      .filter((s) => s.key !== "unallocated")
      .reduce((sum, s) => sum + s.cents, 0);
    const isOverAllocated = allocatedCents > netCents;
    const sliderTotalCents = Math.max(netCents, allocatedCents);

    const { nominalSeries, earnings } = this.buildTotalInvestmentSeries(session);
    const adjusted = this.inflationManager.adjustMonthlySeriesToReal(
      nominalSeries.map((p) => ({ monthIndex: p.monthIndex, totalValue: Money.fromCents(p.nominalCents) })),
      session.assumedAnnualInflation,
    );

    const nominalVsRealSeries: NominalRealPoint[] = adjusted.map((p) => ({
      monthIndex: p.monthIndex,
      nominalCents: p.nominal.getCents(),
      realCents: p.real.getCents(),
    }));

    const goalFundBalanceSeries = session.goalFunds.map((g) => ({
      fundId: g.id,
      name: g.name,
      points: this.goalProjection.project(g, session.projectionHorizonYears).points.map((p) => ({
        monthIndex: p.monthIndex,
        cents: p.balance.getCents(),
      })),
    }));

    const debtBalanceSeries = session.debts.map((d) => ({
      debtId: d.id,
      name: d.name,
      points: this.debtAmortization.buildSchedule(d, session.projectionHorizonYears).points.map((p) => ({
        monthIndex: p.monthIndex,
        cents: -p.endingBalance.getCents(),
      })),
    }));

    return {
      netIncomeMonthly: netMonthly,
      memberNetIncomeMonthly,
      sliderTotalCents,
      isOverAllocated,
      segments,
      nominalVsRealSeries,
      earningsDecomposition: earnings,
      goalFundBalanceSeries,
      debtBalanceSeries,
    };
  }

  private buildSegments(session: BudgetSession, netIncomeMonthly: Money): AllocationSegment[] {
    const segments: AllocationSegment[] = [];

    segments.push(this.segment("household", "Household", session.household.allocatedMonthly.getCents()));

    for (const b of session.investments) {
      segments.push(
        this.segment(`investment:${b.id}`, b.name, b.monthlyContribution.getCents()),
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
      const paymentCents =
        d.payoffPlan.kind === "monthlyPayment" ? d.payoffPlan.monthlyPayment.getCents() : 0;
      segments.push(this.segment(`debt:${d.id}`, d.name, paymentCents));
    }

    const allocatedCents = segments.reduce((sum, s) => sum + s.cents, 0);
    const unallocatedCents = Math.max(0, netIncomeMonthly.getCents() - allocatedCents);
    segments.push(this.segment("unallocated", "Unallocated", unallocatedCents));

    return segments;
  }

  private segment(key: string, label: string, cents: number): AllocationSegment {
    return {
      key: key as any,
      label,
      cents: Math.max(0, Math.round(cents)),
      colorClass: SegmentColorFactory.colorForKey(key),
    };
  }

  private buildTotalInvestmentSeries(
    session: BudgetSession,
  ): Readonly<{ nominalSeries: ReadonlyArray<NominalRealPoint>; earnings: EarningsDecomposition }> {
    const { timeline } = this.cashflowTimeline.build(session);

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

