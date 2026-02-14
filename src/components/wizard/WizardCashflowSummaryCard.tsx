"use client";

import { useMemo } from "react";
import { useWatch, useFormContext } from "react-hook-form";
import { WizardFormInputValues } from "@/components/wizard/WizardSchema";
import { MoneyParser } from "@/domain/adapters/MoneyParser";
import { Money } from "@/domain/models/Money";
import { HouseholdTaxEngineManager } from "@/domain/managers/tax/HouseholdTaxEngineManager";
import { WizardSessionMapper } from "@/domain/adapters/WizardSessionMapper";
import { WizardDebtPaymentCalculator } from "@/components/wizard/WizardDebtPaymentCalculator";
import { DateMonthMath } from "@/domain/managers/debts/DateMonthMath";

type Row = Readonly<{ label: string; value: string; emphasis?: boolean }>;

export function WizardCashflowSummaryCard() {
  const { control } = useFormContext<WizardFormInputValues>();

  const wizardValues = useWatch({ control }) as any;
  const members = useWatch({ control, name: "members" }) ?? [];
  const householdAllocatedMonthly = useWatch({ control, name: "householdAllocatedMonthly" });
  const investments = useWatch({ control, name: "investments" }) ?? [];
  const templates = useWatch({ control, name: "templates" }) ?? [];
  const goalFunds = useWatch({ control, name: "goalFunds" }) ?? [];
  const debts = useWatch({ control, name: "debts" }) ?? [];
  const taxYear = useWatch({ control, name: "locale.taxYear" });

  const taxEngine = useMemo(() => new HouseholdTaxEngineManager(), []);
  const sessionMapper = useMemo(() => new WizardSessionMapper(), []);
  const debtCalc = useMemo(() => new WizardDebtPaymentCalculator(), []);
  const upcomingDebts = useMemo(() => debtCalc.upcomingDebts(debts), [debtCalc, debts]);

  const grossAnnualCents = members.reduce(
    (sum, m) => sum + MoneyParser.tryParseCadOrZero(m.employmentIncomeAnnual).getCents(),
    0,
  );
  const grossMonthlyCents = Math.round(grossAnnualCents / 12);

  const previewSession = useMemo(() => {
    // Use the same mapping that creates the dashboard session to avoid preview drift.
    return sessionMapper.map({ ...wizardValues, locale: { ...(wizardValues?.locale ?? {}), taxYear } });
  }, [sessionMapper, taxYear, wizardValues]);

  const tax = useMemo(() => taxEngine.estimate(previewSession as any), [taxEngine, previewSession]);
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
  const debtsMonthlyCents = debtCalc.sumMonthlyPaymentsCentsThisMonth(debts);

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

      {upcomingDebts.length > 0 ? (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-900">Upcoming debts</p>
          <p className="mt-1 text-xs text-slate-600">
            These debts start in a future month and contribute <span className="font-semibold text-slate-900">$0</span>{" "}
            to this month’s outflow.
          </p>
          <div className="mt-2 space-y-1">
            {upcomingDebts.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900">{d.name}</span>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-700">
                    Starts {DateMonthMath.monthKey(d.startDateIso)}
                  </span>
                </div>
                <span className="text-xs text-slate-700">
                  Planned:{" "}
                  <span className="font-semibold text-slate-900">
                    {Money.fromCents(d.plannedPaymentCents).formatCad()}/mo
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

