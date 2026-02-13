"use client";

import { useEffect, useMemo } from "react";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { WizardFormInputValues } from "@/components/wizard/WizardSchema";

type SourceKind = WizardFormInputValues["redirectRules"][number]["sourceKind"];
type DestinationKind = WizardFormInputValues["redirectRules"][number]["destinationKind"];

type Option = Readonly<{ id: string; label: string }>;

type Props = Readonly<{
  sourceKind: SourceKind;
  sourceId: string;
  label: string;
}>;

export function CeilingRedirectInlinePicker(props: Props) {
  const { control } = useFormContext<WizardFormInputValues>();

  const redirectRulesArray = useFieldArray({ control, name: "redirectRules", keyName: "_key" });
  const rules = useWatch({ control, name: "redirectRules" }) ?? [];

  const ruleIndex = useMemo(() => {
    return rules.findIndex((r: any) => r.sourceKind === props.sourceKind && r.sourceId === props.sourceId);
  }, [rules, props.sourceKind, props.sourceId]);

  useEffect(() => {
    if (ruleIndex >= 0) return;
    redirectRulesArray.append({
      id: WizardIdFactory.create(),
      sourceKind: props.sourceKind,
      sourceId: props.sourceId,
      destinationKind: "Unallocated",
      destinationId: undefined,
    } as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruleIndex, props.sourceKind, props.sourceId]);

  if (ruleIndex < 0) return null;
  return <CeilingRedirectInlinePickerInner ruleIndex={ruleIndex} label={props.label} />;
}

function CeilingRedirectInlinePickerInner(
  props: Readonly<{ ruleIndex: number; label: string }>,
) {
  const { control } = useFormContext<WizardFormInputValues>();
  const investments = useWatch({ control, name: "investments" }) ?? [];
  const goalFunds = useWatch({ control, name: "goalFunds" }) ?? [];
  const debts = useWatch({ control, name: "debts" }) ?? [];

  const destinationKind = useWatch({
    control,
    name: `redirectRules.${props.ruleIndex}.destinationKind`,
  }) as DestinationKind;

  const options: ReadonlyArray<Option> =
    destinationKind === "InvestmentBucket"
      ? investments.map((i) => ({ id: i.id, label: i.name }))
      : destinationKind === "GoalFund"
        ? goalFunds.map((g) => ({ id: g.id, label: g.name }))
        : destinationKind === "DebtLoan"
          ? debts.map((d) => ({ id: d.id, label: d.name }))
          : [];

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-700">{props.label}</p>
      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-12">
        <div className="md:col-span-4">
          <FieldLabel htmlFor={`redirectRules.${props.ruleIndex}.destinationKind`}>Redirect to</FieldLabel>
          <Controller
            control={control}
            name={`redirectRules.${props.ruleIndex}.destinationKind`}
            render={({ field }) => (
              <select
                id={`redirectRules.${props.ruleIndex}.destinationKind`}
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
          {destinationKind === "Unallocated" ? null : (
            <div>
              <FieldLabel htmlFor={`redirectRules.${props.ruleIndex}.destinationId`}>Destination</FieldLabel>
              <Controller
                control={control}
                name={`redirectRules.${props.ruleIndex}.destinationId`}
                render={({ field }) => (
                  <select
                    id={`redirectRules.${props.ruleIndex}.destinationId`}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

class WizardIdFactory {
  public static create(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

