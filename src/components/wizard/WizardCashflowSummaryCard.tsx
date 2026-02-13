"use client";

import { useMemo } from "react";
import { useWatch, useFormContext } from "react-hook-form";
import { WizardFormInputValues } from "@/components/wizard/WizardSchema";
import { MoneyParser } from "@/domain/adapters/MoneyParser";
import { Money } from "@/domain/models/Money";
import { HouseholdTaxEngineManager } from "@/domain/managers/tax/HouseholdTaxEngineManager";
import { BudgetSessionFactory } from "@/domain/models/BudgetSession";
import { HouseholdBudgetFactory } from "@/domain/models/HouseholdBudget";
import { InvestmentBucketFactory } from "@/domain/models/InvestmentBucket";
import { RateBps } from "@/domain/models/RateBps";

type Row = Readonly<{ label: string; value: string; emphasis?: boolean }>;

export function WizardCashflowSummaryCard() {
  const { control } = useFormContext<WizardFormInputValues>();

  const members = useWatch({ control, name: "members" }) ?? [];
  const householdAllocatedMonthly = useWatch({ control, name: "householdAllocatedMonthly" });
  const investments = useWatch({ control, name: "investments" }) ?? [];
  const templates = useWatch({ control, name: "templates" }) ?? [];
  const goalFunds = useWatch({ control, name: "goalFunds" }) ?? [];
  const debts = useWatch({ control, name: "debts" }) ?? [];
  const taxYear = useWatch({ control, name: "locale.taxYear" });

  const taxEngine = useMemo(() => new HouseholdTaxEngineManager(), []);

  const grossAnnualCents = members.reduce(
    (sum, m) => sum + MoneyParser.tryParseCadOrZero(m.employmentIncomeAnnual).getCents(),
    0,
  );
  const grossMonthlyCents = Math.round(grossAnnualCents / 12);

  const sessionLike = useMemo(() => {
    const base = BudgetSessionFactory.createNew();
    return {
      ...base,
      locale: { ...base.locale, taxYear },
      members: members.map((m) => ({
        id: m.id,
        displayName: m.displayName,
        employmentIncomeAnnual: Money.fromCents(MoneyParser.tryParseCadOrZero(m.employmentIncomeAnnual).getCents()),
        tfsaRoomEntries: [],
        rrspContributionRoomAnnual: Money.zero(),
      })),
      household: HouseholdBudgetFactory.createWithAllocatedMonthly(
        Money.fromCents(MoneyParser.tryParseCadOrZero(householdAllocatedMonthly).getCents()),
      ),
      investments: investments.map((b) => ({
        ...InvestmentBucketFactory.createDefault(b.kind as any, b.ownerMemberId),
        id: b.id,
        kind: b.kind as any,
        name: b.name,
        ownerMemberId: b.ownerMemberId,
        monthlyContribution: Money.fromCents(MoneyParser.tryParseCadOrZero(b.monthlyContribution).getCents()),
        isRecurringMonthly: b.isRecurringMonthly,
        expectedAnnualReturn: RateBps.fromPercent(b.expectedAnnualReturnPercent),
        startingBalance: Money.zero(),
        backfillContributions: [],
        startDateIso: b.startDateIso,
      })),
    };
  }, [members, householdAllocatedMonthly, investments, taxYear]);

  const tax = useMemo(() => taxEngine.estimate(sessionLike as any), [taxEngine, sessionLike]);
  const netMonthlyCents = tax.netIncomeMonthly.getCents();

  const householdCents = MoneyParser.tryParseCadOrZero(householdAllocatedMonthly).getCents();
  const investmentMonthlyCents = investments.reduce((sum, i) => {
    const m = MoneyParser.tryParseCadOrZero(i.monthlyContribution).getCents();
    return sum + (i.isRecurringMonthly ? m : 0);
  }, 0);
  const templateMonthlyCents = templates.reduce(
    (sum, t) => sum + MoneyParser.tryParseCadOrZero(t.monthlyAllocation).getCents(),
    0,
  );
  const goalsMonthlyCents = goalFunds.reduce(
    (sum, g) => sum + MoneyParser.tryParseCadOrZero(g.monthlyContribution).getCents(),
    0,
  );
  const debtsMonthlyCents = debts.reduce((sum, d) => {
    if (d.payoffPlanKind !== "monthlyPayment") return sum;
    return sum + MoneyParser.tryParseCadOrZero(d.monthlyPayment).getCents();
  }, 0);

  const plannedOutflowCents =
    householdCents + investmentMonthlyCents + templateMonthlyCents + goalsMonthlyCents + debtsMonthlyCents;
  const availableCents = netMonthlyCents - plannedOutflowCents;

  const rows: Row[] = [
    { label: "Gross income (monthly)", value: Money.fromCents(grossMonthlyCents).formatCad() },
    { label: "Net income (estimated, monthly)", value: Money.fromCents(netMonthlyCents).formatCad(), emphasis: true },
    { label: "Planned outflow (monthly)", value: Money.fromCents(plannedOutflowCents).formatCad() },
    {
      label: "Available (net − outflow)",
      value: Money.fromCents(availableCents).formatCad(),
      emphasis: true,
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">Cashflow summary</p>
      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-600">{r.label}</p>
            <p className={r.emphasis ? "text-xs font-semibold text-slate-900" : "text-xs text-slate-900"}>
              {r.value}
            </p>
          </div>
        ))}
      </div>
      {availableCents < 0 ? (
        <p className="mt-2 text-xs font-semibold text-red-700">
          You’re allocating more than your estimated net income.
        </p>
      ) : null}
    </div>
  );
}

