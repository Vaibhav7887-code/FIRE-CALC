"use client";

import { useEffect } from "react";
import { useWatch, useFormContext } from "react-hook-form";
import { WizardFormInputValues } from "@/components/wizard/WizardSchema";
import { MoneyParser } from "@/domain/adapters/MoneyParser";
import { Controller, useFieldArray } from "react-hook-form";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { FieldErrorText } from "@/components/ui/FieldErrorText";
import { WizardCashflowSummaryCard } from "@/components/wizard/WizardCashflowSummaryCard";

class TotalsCalculator {
  public static monthlyInvestmentTotalCents(
    investments: WizardFormInputValues["investments"],
  ): number {
    return investments.reduce((sum, b) => {
      const m = MoneyParser.tryParseCadOrZero(b.monthlyContribution).getCents();
      return sum + (b.isRecurringMonthly ? m : 0);
    }, 0);
  }
}

export function StepReview() {
  const { control } = useFormContext<WizardFormInputValues>();
  const members = useWatch({ control, name: "members" }) ?? [];
  const household = useWatch({ control, name: "householdAllocatedMonthly" });
  const investments = useWatch({ control, name: "investments" }) ?? [];
  const templates = useWatch({ control, name: "templates" }) ?? [];
  const goalFunds = useWatch({ control, name: "goalFunds" }) ?? [];
  const debts = useWatch({ control, name: "debts" }) ?? [];

  const redirectRulesArray = useFieldArray({ control, name: "redirectRules", keyName: "_key" });

  const householdGrossAnnualCents = members.reduce(
    (sum, m) => sum + MoneyParser.tryParseCadOrZero(m.employmentIncomeAnnual).getCents(),
    0,
  );
  const grossMonthlyCents = Math.round(householdGrossAnnualCents / 12);

  const investmentMonthlyCents = TotalsCalculator.monthlyInvestmentTotalCents(investments);
  const templateMonthlyCents = templates.reduce(
    (sum, t) => sum + MoneyParser.tryParseCadOrZero(t.monthlyAllocation).getCents(),
    0,
  );
  const goalMonthlyCents = goalFunds.reduce(
    (sum, g) => sum + MoneyParser.tryParseCadOrZero(g.monthlyContribution).getCents(),
    0,
  );
  const debtMonthlyCents = debts.reduce((sum, d) => {
    if (d.payoffPlanKind !== "monthlyPayment") return sum;
    return sum + MoneyParser.tryParseCadOrZero(d.monthlyPayment).getCents();
  }, 0);

  const householdCents = MoneyParser.tryParseCadOrZero(household).getCents();

  const plannedMonthlyCents =
    householdCents + investmentMonthlyCents + templateMonthlyCents + goalMonthlyCents + debtMonthlyCents;

  return (
    <div className="space-y-4">
      <WizardCashflowSummaryCard />
      <p className="text-sm text-slate-600">
        Review your baseline inputs. You’ll be able to rebalance on the dashboard without
        losing the original baseline.
      </p>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <SummaryRow label="Gross income (monthly, approx)" value={`$${(grossMonthlyCents / 100).toFixed(2)}`} />
          <SummaryRow label="Household expenses (monthly)" value={`$${(householdCents / 100).toFixed(2)}`} />
          <SummaryRow label="Recurring investments (monthly)" value={`$${(investmentMonthlyCents / 100).toFixed(2)}`} />
          <SummaryRow label="Templates (monthly)" value={`$${(templateMonthlyCents / 100).toFixed(2)}`} />
          <SummaryRow label="Goal funds (monthly)" value={`$${(goalMonthlyCents / 100).toFixed(2)}`} />
          <SummaryRow label="Debt payments (monthly)" value={`$${(debtMonthlyCents / 100).toFixed(2)}`} />
        </div>

        <div className="mt-4 border-t border-slate-200 pt-4">
          <SummaryRow
            label="Planned outflow (monthly)"
            value={`$${(plannedMonthlyCents / 100).toFixed(2)}`}
            emphasis
          />
        </div>
      </div>

      <RedirectRulesEditor
        control={control}
        redirectRuleFields={redirectRulesArray.fields}
        appendRule={redirectRulesArray.append}
        goalFunds={goalFunds}
        investments={investments}
        debts={debts}
      />
    </div>
  );
}

function SummaryRow(props: Readonly<{ label: string; value: string; emphasis?: boolean }>) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-slate-600">{props.label}</p>
      <p className={props.emphasis ? "text-sm font-semibold text-slate-900" : "text-sm text-slate-900"}>
        {props.value}
      </p>
    </div>
  );
}

function RedirectRulesEditor(props: Readonly<{
  control: any;
  redirectRuleFields: ReadonlyArray<any>;
  appendRule: (value: any) => void;
  goalFunds: WizardFormInputValues["goalFunds"];
  investments: WizardFormInputValues["investments"];
  debts: WizardFormInputValues["debts"];
}>) {
  const existingRules = useWatch({ control: props.control, name: "redirectRules" }) ?? [];

  useEffect(() => {
    const hasSource = (kind: string, id: string) =>
      existingRules.some((r: any) => r.sourceKind === kind && r.sourceId === id);

    props.goalFunds.forEach((g) => {
      if (hasSource("GoalFund", g.id)) return;
      props.appendRule({
        id: WizardIdFactory.create(),
        sourceKind: "GoalFund",
        sourceId: g.id,
        destinationKind: "Unallocated",
        destinationId: undefined,
      } as any);
    });

    props.debts.forEach((d) => {
      if (hasSource("DebtLoan", d.id)) return;
      props.appendRule({
        id: WizardIdFactory.create(),
        sourceKind: "DebtLoan",
        sourceId: d.id,
        destinationKind: "Unallocated",
        destinationId: undefined,
      } as any);
    });

    props.investments.forEach((inv) => {
      const isRegistered = inv.kind === "TFSA" || inv.kind === "RRSP";
      if (!isRegistered) return;
      if (hasSource("RegisteredRoomCeiling", inv.id)) return;
      props.appendRule({
        id: WizardIdFactory.create(),
        sourceKind: "RegisteredRoomCeiling",
        sourceId: inv.id,
        destinationKind: "Unallocated",
        destinationId: undefined,
      } as any);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.goalFunds.length, props.debts.length, props.investments.length, existingRules.length]);

  if (props.redirectRuleFields.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Ceiling redirect rules</h3>
      <p className="mt-1 text-xs text-slate-600">
        When a goal is completed or a debt is paid off, choose where the freed monthly cashflow should go.
      </p>

      <div className="mt-3 space-y-3">
        {props.redirectRuleFields.map((r, idx) => {
          const sourceKind = (r as any).sourceKind as WizardFormInputValues["redirectRules"][number]["sourceKind"];
          const sourceId = (r as any).sourceId as string;
          const sourceLabel = SourceLabelResolver.resolve(sourceKind, sourceId, props.goalFunds, props.debts);

          return (
            <div key={(r as any)._key ?? (r as any).id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-700">When {sourceLabel} completes</p>

              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-12">
                <div className="md:col-span-4">
                  <FieldLabel htmlFor={`redirectRules.${idx}.destinationKind`}>Redirect to</FieldLabel>
                  <Controller
                    control={props.control}
                    name={`redirectRules.${idx}.destinationKind`}
                    render={({ field }) => (
                      <select
                        id={`redirectRules.${idx}.destinationKind`}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className={[
                          "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm",
                          "focus:outline-none focus:ring-2 focus:ring-slate-400",
                        ].join(" ")}
                      >
                        <option value="Unallocated">Unallocated</option>
                        <option value="InvestmentBucket">Investment bucket</option>
                        <option value="GoalFund">Goal fund</option>
                        <option value="DebtLoan">Debt loan</option>
                      </select>
                    )}
                  />
                </div>

                <div className="md:col-span-8">
                  <RedirectDestinationPicker
                    control={props.control}
                    index={idx}
                    investments={props.investments}
                    goalFunds={props.goalFunds}
                    debts={props.debts}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RedirectDestinationPicker(props: Readonly<{
  control: any;
  index: number;
  investments: WizardFormInputValues["investments"];
  goalFunds: WizardFormInputValues["goalFunds"];
  debts: WizardFormInputValues["debts"];
}>) {
  const destinationKind = useWatch({
    control: props.control,
    name: `redirectRules.${props.index}.destinationKind`,
  }) as WizardFormInputValues["redirectRules"][number]["destinationKind"];

  const needsId =
    destinationKind === "InvestmentBucket" || destinationKind === "GoalFund" || destinationKind === "DebtLoan";
  if (!needsId) return null;

  const options =
    destinationKind === "InvestmentBucket"
      ? props.investments.map((i) => ({ id: i.id, label: i.name }))
      : destinationKind === "GoalFund"
        ? props.goalFunds.map((g) => ({ id: g.id, label: g.name }))
        : props.debts.map((d) => ({ id: d.id, label: d.name }));

  return (
    <div>
      <FieldLabel htmlFor={`redirectRules.${props.index}.destinationId`}>Destination</FieldLabel>
      <Controller
        control={props.control}
        name={`redirectRules.${props.index}.destinationId`}
        render={({ field }) => (
          <select
            id={`redirectRules.${props.index}.destinationId`}
            value={field.value ?? ""}
            onChange={(e) => field.onChange(e.target.value)}
            className={[
              "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-slate-400",
            ].join(" ")}
          >
            <option value="" disabled>
              Select…
            </option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        )}
      />
      <FieldErrorText message={undefined} />
    </div>
  );
}

class SourceLabelResolver {
  public static resolve(
    kind: WizardFormInputValues["redirectRules"][number]["sourceKind"],
    id: string,
    goals: WizardFormInputValues["goalFunds"],
    debts: WizardFormInputValues["debts"],
  ): string {
    if (kind === "GoalFund") return goals.find((g) => g.id === id)?.name ?? "Goal";
    if (kind === "DebtLoan") return debts.find((d) => d.id === id)?.name ?? "Debt";
    return "Ceiling";
  }
}

class WizardIdFactory {
  public static create(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

