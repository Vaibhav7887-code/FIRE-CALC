import { BudgetSession } from "@/domain/models/BudgetSession";
import { Money } from "@/domain/models/Money";
import { HouseholdTaxEngineManager } from "@/domain/managers/tax/HouseholdTaxEngineManager";
import { DebtAmortizationManager } from "@/domain/managers/debts/DebtAmortizationManager";
import { BudgetDashboardViewData } from "@/domain/viewmodels/BudgetDashboardViewData";

type XlsxModule = typeof import("xlsx");

class SheetRowFactory {
  public static currency(cents: number): number {
    // Excel stores numbers; formatting is up to the user.
    return Math.round(cents) / 100;
  }

  public static percentFromBps(bps: number): number {
    return bps / 100;
  }
}

export class ExcelExportManager {
  private readonly householdTaxEngine: HouseholdTaxEngineManager;
  private readonly debtAmortization: DebtAmortizationManager;

  public constructor(householdTaxEngine: HouseholdTaxEngineManager = new HouseholdTaxEngineManager()) {
    this.householdTaxEngine = householdTaxEngine;
    this.debtAmortization = new DebtAmortizationManager();
  }

  public async downloadWorkbook(session: BudgetSession, viewData: BudgetDashboardViewData): Promise<void> {
    const XLSX: XlsxModule = await import("xlsx");

    const tax = this.householdTaxEngine.estimate(session);

    const wb = XLSX.utils.book_new();

    const sessionSummary = [
      {
        taxYear: session.locale.taxYear,
        inflationPercent: session.assumedAnnualInflation.toPercent(),
        horizonYears: session.projectionHorizonYears,
        netIncomeMonthly: SheetRowFactory.currency(viewData.netIncomeMonthly.getCents()),
      },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sessionSummary), "SessionSummary");

    const membersSheet = tax.members.map((m) => ({
      memberId: m.memberId,
      name: m.displayName,
      grossAnnual: SheetRowFactory.currency(
        session.members.find((x) => x.id === m.memberId)?.employmentIncomeAnnual.getCents() ?? 0,
      ),
      taxableAnnual: SheetRowFactory.currency(m.tax.taxableIncomeAnnual.getCents()),
      rrspDeductionAnnual: SheetRowFactory.currency(m.tax.rrspDeductionAnnual.getCents()),
      federalTaxAnnual: SheetRowFactory.currency(m.tax.federalTaxAnnual.getCents()),
      bcTaxAnnual: SheetRowFactory.currency(m.tax.provincialTaxAnnual.getCents()),
      cppAnnual: SheetRowFactory.currency(m.tax.cppAnnual.getCents()),
      eiAnnual: SheetRowFactory.currency(m.tax.eiAnnual.getCents()),
      netAnnual: SheetRowFactory.currency(m.tax.netIncomeAnnual.getCents()),
      netMonthly: SheetRowFactory.currency(m.tax.netIncomeMonthly.getCents()),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(membersSheet), "Members");

    const householdExpensesSheet = [
      {
        allocatedMonthly: SheetRowFactory.currency(session.household.allocatedMonthly.getCents()),
      },
      ...session.household.categories.map((c) => ({
        category: c.name,
        monthlyAmount: SheetRowFactory.currency(c.monthlyAmount.getCents()),
      })),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(householdExpensesSheet), "HouseholdExpenses");

    const investmentsSheet = session.investments.map((b) => ({
      bucketId: b.id,
      kind: b.kind,
      name: b.name,
      owner: b.ownerMemberId
        ? session.members.find((m) => m.id === b.ownerMemberId)?.displayName ?? "Unknown"
        : "",
      startingBalance: SheetRowFactory.currency(b.startingBalance.getCents()),
      monthlyContribution: SheetRowFactory.currency(b.monthlyContribution.getCents()),
      backfillThisYear: SheetRowFactory.currency(
        b.backfillContributions
          .filter((e) => e.year === session.locale.taxYear)
          .reduce((sum, e) => sum + e.amount.getCents(), 0),
      ),
      recurringMonthly: b.isRecurringMonthly,
      expectedAnnualReturnPercent: b.expectedAnnualReturn.toPercent(),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(investmentsSheet), "Investments");

    const goalFundsSheet = session.goalFunds.map((g) => ({
      goalId: g.id,
      name: g.name,
      targetAmount: SheetRowFactory.currency(g.targetAmount.getCents()),
      currentBalance: SheetRowFactory.currency(g.currentBalance.getCents()),
      monthlyContribution: SheetRowFactory.currency(g.monthlyContribution.getCents()),
      expectedAnnualReturnPercent: g.expectedAnnualReturn.toPercent(),
      targetDate: g.targetDateIso ?? "",
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(goalFundsSheet), "GoalFunds");

    const debtsSheet = session.debts.map((d) => ({
      debtId: d.id,
      name: d.name,
      currentBalance: SheetRowFactory.currency(d.currentBalance.getCents()),
      annualAprPercent: d.annualApr.toPercent(),
      startDate: d.startDateIso ?? "",
      payoffPlanKind: d.payoffPlan.kind,
      monthlyPayment:
        d.payoffPlan.kind === "monthlyPayment"
          ? SheetRowFactory.currency(d.payoffPlan.monthlyPayment.getCents())
          : "",
      targetPayoffDate: d.payoffPlan.kind === "targetDate" ? d.payoffPlan.targetPayoffDateIso : "",
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(debtsSheet), "Debts");

    const templatesSheet = session.templates.map((t) => ({
      templateId: t.id,
      kind: t.kind,
      name: t.name,
      monthlyAllocation: SheetRowFactory.currency(t.monthlyAllocation.getCents()),
      expectedAnnualReturnPercent: t.expectedAnnualReturn.toPercent(),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(templatesSheet), "Templates");

    const debtScheduleYearly = this.toYearlyDebtSchedule(session);
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([...debtScheduleYearly]),
      "DebtScheduleYearly",
    );

    const projectionYearly = this.toYearlyProjection(viewData);
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([...projectionYearly]),
      "ProjectionYearly",
    );

    XLSX.writeFile(wb, "budgeting-session.xlsx");
  }

  private toYearlyProjection(viewData: BudgetDashboardViewData): Array<{
    year: number;
    nominal: number;
    real: number;
  }> {
    const rows: Array<{ year: number; nominal: number; real: number }> = [];
    for (const p of viewData.nominalVsRealSeries) {
      if (p.monthIndex % 12 !== 0) continue;
      rows.push({
        year: p.monthIndex / 12,
        nominal: SheetRowFactory.currency(p.nominalCents),
        real: SheetRowFactory.currency(p.realCents),
      });
    }
    return rows;
  }

  private toYearlyDebtSchedule(session: BudgetSession): Array<{
    debtId: string;
    name: string;
    year: number;
    balance: number;
  }> {
    const rows: Array<{ debtId: string; name: string; year: number; balance: number }> = [];

    for (const d of session.debts) {
      const schedule = this.debtAmortization.buildSchedule(d, session.projectionHorizonYears);
      for (const p of schedule.points) {
        if (p.monthIndex % 12 !== 0) continue;
        rows.push({
          debtId: d.id,
          name: d.name,
          year: p.monthIndex / 12,
          balance: SheetRowFactory.currency(p.endingBalance.getCents()),
        });
      }
    }

    return rows;
  }
}

