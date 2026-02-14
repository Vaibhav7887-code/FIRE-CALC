import { WizardFormInputValues } from "@/components/wizard/WizardSchema";
import { MoneyParser } from "@/domain/adapters/MoneyParser";
import { DebtAmortizationManager } from "@/domain/managers/debts/DebtAmortizationManager";
import { DateMonthMath } from "@/domain/managers/debts/DateMonthMath";
import { Money } from "@/domain/models/Money";
import { RateBps } from "@/domain/models/RateBps";

export type WizardDebtInput = WizardFormInputValues["debts"][number];

export class WizardDebtPaymentCalculator {
  private readonly amortization: DebtAmortizationManager;
  private readonly timelineStartIso: string;

  public constructor(
    amortization: DebtAmortizationManager = new DebtAmortizationManager(),
    timelineStartIso: string = DateMonthMath.currentMonthIso(),
  ) {
    this.amortization = amortization;
    this.timelineStartIso = timelineStartIso;
  }

  /**
   * Returns the debt's planned monthly payment amount when active (ignores whether it's future-start).
   * - monthlyPayment plan: uses entered amount
   * - targetDate plan: computes implied amount
   */
  public monthlyPaymentCents(debt: WizardDebtInput): number {
    const balanceCents = MoneyParser.tryParseCadOrZero(debt.currentBalance).getCents();
    if (balanceCents <= 0) return 0;

    if (debt.payoffPlanKind === "monthlyPayment") {
      return Math.max(0, MoneyParser.tryParseCadOrZero(debt.monthlyPayment).getCents());
    }

    const targetIso = debt.targetPayoffDateIso;
    if (!targetIso || targetIso.length === 0) return 0;

    const startIso =
      debt.startDateIso && debt.startDateIso.length > 0 ? debt.startDateIso : this.timelineStartIso;

    const debtLike = {
      id: debt.id,
      name: debt.name,
      currentBalance: Money.fromCents(balanceCents),
      annualApr: RateBps.fromPercent(debt.annualAprPercent),
      startDateIso: startIso,
      payoffPlan: { kind: "targetDate", targetPayoffDateIso: targetIso },
    } as const;

    return Math.max(0, this.amortization.computeMonthlyPaymentFromDebt(debtLike as any).getCents());
  }

  /**
   * Returns the monthly payment for the current month only.
   * Future-start debts contribute $0 this month.
   */
  public monthlyPaymentCentsThisMonth(debt: WizardDebtInput): number {
    if (this.isFutureStart(debt)) return 0;
    return this.monthlyPaymentCents(debt);
  }

  public sumMonthlyPaymentsCentsThisMonth(debts: ReadonlyArray<WizardDebtInput>): number {
    return debts.reduce((sum, d) => sum + this.monthlyPaymentCentsThisMonth(d), 0);
  }

  public sumMonthlyPaymentsCents(debts: ReadonlyArray<WizardDebtInput>): number {
    return debts.reduce((sum, d) => sum + this.monthlyPaymentCents(d), 0);
  }

  public upcomingDebts(debts: ReadonlyArray<WizardDebtInput>): ReadonlyArray<{
    id: string;
    name: string;
    startDateIso: string;
    plannedPaymentCents: number;
  }> {
    return debts
      .filter((d) => this.isFutureStart(d))
      .map((d) => {
        const startIso = d.startDateIso && d.startDateIso.length > 0 ? d.startDateIso : this.timelineStartIso;
        const plannedPaymentCents = this.monthlyPaymentCents(d);
        return { id: d.id, name: d.name, startDateIso: startIso, plannedPaymentCents };
      })
      .filter((x) => x.plannedPaymentCents > 0);
  }

  private isFutureStart(debt: WizardDebtInput): boolean {
    const startIso = debt.startDateIso && debt.startDateIso.length > 0 ? debt.startDateIso : this.timelineStartIso;
    try {
      return DateMonthMath.monthsBetweenIso(this.timelineStartIso, startIso) > 0;
    } catch {
      return false;
    }
  }
}

