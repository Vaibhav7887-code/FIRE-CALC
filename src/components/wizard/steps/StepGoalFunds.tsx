"use client";

import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { FieldErrorText } from "@/components/ui/FieldErrorText";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { TextInput } from "@/components/ui/TextInput";
import { DateInput } from "@/components/ui/DateInput";
import { ReorderButtons } from "@/components/ui/ReorderButtons";
import { WizardFormInputValues } from "@/components/wizard/WizardSchema";
import { MoneyParser } from "@/domain/adapters/MoneyParser";
import { DateMonthMath } from "@/domain/managers/debts/DateMonthMath";
import { GoalFundPlanningManager } from "@/domain/managers/goals/GoalFundPlanningManager";
import { WizardCashflowSummaryCard } from "@/components/wizard/WizardCashflowSummaryCard";
import { CeilingRedirectInlinePicker } from "@/components/wizard/CeilingRedirectInlinePicker";

export function StepGoalFunds() {
  const {
    control,
    formState: { errors },
  } = useFormContext<WizardFormInputValues>();

  const goalFundsArray = useFieldArray({ control, name: "goalFunds" });
  const planner = new GoalFundPlanningManager();

  return (
    <div className="space-y-4">
      <WizardCashflowSummaryCard />
      <p className="text-sm text-slate-600">
        Goal funds are “sinking funds” like Emergency fund or a Japan trip. They contribute monthly
        until the goal is met (then they stop).
      </p>

      <div className="flex flex-wrap gap-2">
        <SecondaryButton
          onClick={() =>
            goalFundsArray.prepend({
              id: WizardIdFactory.create(),
              name: "Emergency fund",
              targetAmount: "0",
              currentBalance: "0",
              expectedAnnualReturnPercent: 3,
              monthlyContribution: "0",
              startDateIso: undefined,
              targetDateIso: undefined,
            })
          }
        >
          + Emergency fund
        </SecondaryButton>
        <SecondaryButton
          onClick={() =>
            goalFundsArray.prepend({
              id: WizardIdFactory.create(),
              name: "Vacation (Japan)",
              targetAmount: "0",
              currentBalance: "0",
              expectedAnnualReturnPercent: 0,
              monthlyContribution: "0",
              startDateIso: undefined,
              targetDateIso: undefined,
            })
          }
        >
          + Vacation
        </SecondaryButton>
        <SecondaryButton
          onClick={() =>
            goalFundsArray.prepend({
              id: WizardIdFactory.create(),
              name: "Custom goal",
              targetAmount: "0",
              currentBalance: "0",
              expectedAnnualReturnPercent: 0,
              monthlyContribution: "0",
              startDateIso: undefined,
              targetDateIso: undefined,
            })
          }
        >
          + Custom goal
        </SecondaryButton>
      </div>

      {goalFundsArray.fields.length === 0 ? (
        <p className="text-sm text-slate-600">No goal funds added.</p>
      ) : (
        <div className="space-y-3">
          {goalFundsArray.fields.map((f, idx) => (
            <GoalFundCard
              key={f.id}
              index={idx}
              total={goalFundsArray.fields.length}
              planner={planner}
              onMoveUp={() => goalFundsArray.move(idx, idx - 1)}
              onMoveDown={() => goalFundsArray.move(idx, idx + 1)}
              onRemove={() => goalFundsArray.remove(idx)}
              errors={errors}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GoalFundCard(props: Readonly<{
  index: number;
  total: number;
  planner: GoalFundPlanningManager;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  errors: any;
}>) {
  const { control, setValue } = useFormContext<WizardFormInputValues>();
  const idx = props.index;

  const goalId = useWatch({ control, name: `goalFunds.${idx}.id` });
  const startDateIso = useWatch({ control, name: `goalFunds.${idx}.startDateIso` });
  const targetDateIso = useWatch({ control, name: `goalFunds.${idx}.targetDateIso` });
  const currentBalance = useWatch({ control, name: `goalFunds.${idx}.currentBalance` });
  const targetAmount = useWatch({ control, name: `goalFunds.${idx}.targetAmount` });

  const startIso = (startDateIso && startDateIso.length > 0) ? startDateIso : DateMonthMath.currentMonthIso();

  const currentCents = MoneyParser.tryParseCadOrZero(currentBalance).getCents();
  const targetCents = MoneyParser.tryParseCadOrZero(targetAmount).getCents();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="w-full space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <FieldLabel htmlFor={`goalFunds.${idx}.name`}>Name</FieldLabel>
              <Controller
                control={control}
                name={`goalFunds.${idx}.name`}
                render={({ field }) => (
                  <TextInput
                    id={`goalFunds.${idx}.name`}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <FieldErrorText message={props.errors.goalFunds?.[idx]?.name?.message as any} />
            </div>

            <div className="space-y-1">
              <FieldLabel htmlFor={`goalFunds.${idx}.startDateIso`}>Start date (optional)</FieldLabel>
              <Controller
                control={control}
                name={`goalFunds.${idx}.startDateIso`}
                render={({ field }) => (
                  <DateInput
                    id={`goalFunds.${idx}.startDateIso`}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="space-y-1">
              <FieldLabel htmlFor={`goalFunds.${idx}.targetDateIso`}>Target date (optional)</FieldLabel>
              <Controller
                control={control}
                name={`goalFunds.${idx}.targetDateIso`}
                render={({ field }) => (
                  <DateInput
                    id={`goalFunds.${idx}.targetDateIso`}
                    value={field.value}
                    onChange={(iso) => {
                      field.onChange(iso);
                      if (!iso) return;
                      const monthlyCents = props.planner.computeMonthlyContributionCents({
                        currentBalanceCents: currentCents,
                        targetAmountCents: targetCents,
                        startDateIso: startIso,
                        targetDateIso: iso,
                      });
                      setValue(`goalFunds.${idx}.monthlyContribution`, (monthlyCents / 100).toFixed(2));
                    }}
                  />
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="space-y-1 md:col-span-1">
              <FieldLabel htmlFor={`goalFunds.${idx}.currentBalance`}>Current balance</FieldLabel>
              <Controller
                control={control}
                name={`goalFunds.${idx}.currentBalance`}
                render={({ field }) => (
                  <TextInput
                    id={`goalFunds.${idx}.currentBalance`}
                    inputMode="decimal"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="space-y-1 md:col-span-1">
              <FieldLabel htmlFor={`goalFunds.${idx}.targetAmount`}>Target amount</FieldLabel>
              <Controller
                control={control}
                name={`goalFunds.${idx}.targetAmount`}
                render={({ field }) => (
                  <TextInput
                    id={`goalFunds.${idx}.targetAmount`}
                    inputMode="decimal"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="space-y-1 md:col-span-1">
              <FieldLabel htmlFor={`goalFunds.${idx}.monthlyContribution`}>Monthly contribution</FieldLabel>
              <Controller
                control={control}
                name={`goalFunds.${idx}.monthlyContribution`}
                render={({ field }) => (
                  <TextInput
                    id={`goalFunds.${idx}.monthlyContribution`}
                    inputMode="decimal"
                    value={field.value}
                    onChange={(v) => {
                      field.onChange(v);
                      const monthlyCents = MoneyParser.tryParseCadOrZero(v).getCents();
                      const implied = props.planner.computeTargetDateIso({
                        currentBalanceCents: currentCents,
                        targetAmountCents: targetCents,
                        startDateIso: startIso,
                        monthlyContributionCents: monthlyCents,
                      });
                      setValue(`goalFunds.${idx}.targetDateIso`, implied);
                    }}
                  />
                )}
              />
            </div>

            <div className="space-y-1 md:col-span-1">
              <FieldLabel htmlFor={`goalFunds.${idx}.expectedAnnualReturnPercent`}>
                Return (% annual)
              </FieldLabel>
              <Controller
                control={control}
                name={`goalFunds.${idx}.expectedAnnualReturnPercent`}
                render={({ field }) => (
                  <TextInput
                    id={`goalFunds.${idx}.expectedAnnualReturnPercent`}
                    inputMode="decimal"
                    value={String(field.value)}
                    onChange={(v) => field.onChange(Number(v))}
                  />
                )}
              />
            </div>
          </div>

          {targetDateIso ? (
            <p className="text-xs text-slate-600">
              Linked: editing Target date recalculates Monthly contribution, and editing Monthly contribution recalculates Target date.
            </p>
          ) : null}

          <CeilingRedirectInlinePicker
            sourceKind="GoalFund"
            sourceId={(goalId as string) ?? ""}
            label="When this goal is reached, redirect the freed monthly amount to"
          />
        </div>

        <div className="flex items-center gap-2">
          <ReorderButtons
            canMoveUp={idx > 0}
            canMoveDown={idx < props.total - 1}
            onMoveUp={props.onMoveUp}
            onMoveDown={props.onMoveDown}
          />
          <PrimaryButton onClick={props.onRemove}>Remove</PrimaryButton>
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

