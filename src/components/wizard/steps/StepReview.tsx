"use client";

import { useEffect, useMemo, useRef } from "react";
import { useWatch, useFormContext } from "react-hook-form";
import { WizardFormInputValues } from "@/components/wizard/WizardSchema";
import { MoneyParser } from "@/domain/adapters/MoneyParser";
import { Controller, useFieldArray } from "react-hook-form";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { FieldErrorText } from "@/components/ui/FieldErrorText";
import { WizardCashflowSummaryCard } from "@/components/wizard/WizardCashflowSummaryCard";
import { WizardDebtPaymentCalculator } from "@/components/wizard/WizardDebtPaymentCalculator";

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
  const debtCalc = useMemo(() => new WizardDebtPaymentCalculator(), []);

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
  const debtMonthlyCents = debtCalc.sumMonthlyPaymentsCentsThisMonth(debts);

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
        replaceRules={redirectRulesArray.replace}
        members={members}
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
  replaceRules: (values: any[]) => void;
  members: WizardFormInputValues["members"];
  goalFunds: WizardFormInputValues["goalFunds"];
  investments: WizardFormInputValues["investments"];
  debts: WizardFormInputValues["debts"];
}>) {
  const existingRules = useWatch({ control: props.control, name: "redirectRules" }) ?? [];
  const ensuredKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // De-dupe by (sourceKind, sourceId) to keep the rules list stable and avoid ambiguous edits.
    // Keep the last occurrence as the winner to match submission dedupe.
    const byKey = new Map<string, any>();
    for (const r of existingRules) {
      const k = `${r?.sourceKind ?? ""}:${r?.sourceId ?? ""}`;
      if (byKey.has(k)) byKey.delete(k);
      byKey.set(k, r);
    }
    if (byKey.size !== existingRules.length) {
      props.replaceRules(Array.from(byKey.values()));
      return;
    }
  }, [existingRules, props.replaceRules]);

  useEffect(() => {
    const ensure = (kind: string, id: string) => {
      const key = `${kind}:${id}`;
      if (!id || id.length === 0) return;
      if (ensuredKeysRef.current.has(key)) return;

      const hasSource = existingRules.some((r: any) => r.sourceKind === kind && r.sourceId === id);
      if (!hasSource) {
        props.appendRule({
          id: WizardIdFactory.create(),
          sourceKind: kind,
          sourceId: id,
          destinationKind: "Unallocated",
          destinationId: undefined,
        } as any);
      }

      ensuredKeysRef.current.add(key);
    };

    props.goalFunds.forEach((g) => ensure("GoalFund", g.id));
    props.debts.forEach((d) => ensure("DebtLoan", d.id));
    props.investments.forEach((inv) => {
      const isRegistered = inv.kind === "TFSA" || inv.kind === "RRSP";
      if (!isRegistered) return;
      ensure("RegisteredRoomCeiling", inv.id);
    });
  }, [existingRules, props.goalFunds, props.debts, props.investments, props.appendRule]);

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
          const sourceLabel = SourceLabelResolver.resolve(
            sourceKind,
            sourceId,
            props.goalFunds,
            props.debts,
            props.investments,
            props.members,
          );

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
  const {
    formState: { errors },
  } = useFormContext<WizardFormInputValues>();

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
      <FieldErrorText message={errors.redirectRules?.[props.index]?.destinationId?.message as any} />
    </div>
  );
}

class SourceLabelResolver {
  public static resolve(
    kind: WizardFormInputValues["redirectRules"][number]["sourceKind"],
    id: string,
    goals: WizardFormInputValues["goalFunds"],
    debts: WizardFormInputValues["debts"],
    investments: WizardFormInputValues["investments"],
    members: WizardFormInputValues["members"],
  ): string {
    if (kind === "GoalFund") return goals.find((g) => g.id === id)?.name ?? "Goal";
    if (kind === "DebtLoan") return debts.find((d) => d.id === id)?.name ?? "Debt";
    const inv = investments.find((i) => i.id === id);
    if (!inv) return "Ceiling";

    const ownerName = inv.ownerMemberId
      ? members.find((m) => m.id === inv.ownerMemberId)?.displayName
      : undefined;
    const base = inv.kind === "TFSA" || inv.kind === "RRSP" ? inv.kind : "Registered";
    const named =
      inv.name && inv.name.trim().length > 0 && inv.name !== inv.kind ? `${base} (${inv.name})` : base;
    return ownerName ? `${named} (${ownerName}) ceiling` : `${named} ceiling`;
  }
}

class WizardIdFactory {
  public static create(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

