"use client";

import { useMemo } from "react";
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
import { Money } from "@/domain/models/Money";
import { RateBps } from "@/domain/models/RateBps";
import { DebtAmortizationManager } from "@/domain/managers/debts/DebtAmortizationManager";
import { DateMonthMath } from "@/domain/managers/debts/DateMonthMath";
import { WizardCashflowSummaryCard } from "@/components/wizard/WizardCashflowSummaryCard";
import { CeilingRedirectInlinePicker } from "@/components/wizard/CeilingRedirectInlinePicker";

export function StepDebts() {
  const {
    control,
    formState: { errors },
  } = useFormContext<WizardFormInputValues>();

  const debtsArray = useFieldArray({ control, name: "debts" });
  const debts = useWatch({ control, name: "debts" }) ?? [];
  const amortization = useMemo(() => new DebtAmortizationManager(), []);

  return (
    <div className="space-y-4">
      <WizardCashflowSummaryCard />
      <p className="text-sm text-slate-600">
        Add debts like a mortgage, car loan, or line of credit. You can specify a monthly payment
        or a target payoff date (we’ll compute an implied monthly payment).
      </p>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Debts</h3>
        <SecondaryButton
          onClick={() =>
            debtsArray.prepend({
              id: WizardIdFactory.create(),
              name: "New debt",
              currentBalance: "0",
              annualAprPercent: 5,
              startDateIso: undefined,
              payoffPlanKind: "monthlyPayment",
              monthlyPayment: "0",
              targetPayoffDateIso: undefined,
            })
          }
        >
          + Add debt
        </SecondaryButton>
      </div>

      {debtsArray.fields.length === 0 ? (
        <p className="text-sm text-slate-600">No debts added.</p>
      ) : (
        <div className="space-y-3">
          {debtsArray.fields.map((f, idx) => {
            const planKind = debts[idx]?.payoffPlanKind ?? "monthlyPayment";
            const debtId = debts[idx]?.id ?? (f as any).id;

            return (
              <div key={f.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-full space-y-3">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <FieldLabel htmlFor={`debts.${idx}.name`}>Name</FieldLabel>
                        <Controller
                          control={control}
                          name={`debts.${idx}.name`}
                          render={({ field }) => (
                            <TextInput
                              id={`debts.${idx}.name`}
                              value={field.value}
                              onChange={field.onChange}
                            />
                          )}
                        />
                        <FieldErrorText message={errors.debts?.[idx]?.name?.message as any} />
                      </div>

                      <div className="space-y-1">
                        <FieldLabel htmlFor={`debts.${idx}.currentBalance`}>Current balance</FieldLabel>
                        <Controller
                          control={control}
                          name={`debts.${idx}.currentBalance`}
                          render={({ field }) => (
                            <TextInput
                              id={`debts.${idx}.currentBalance`}
                              inputMode="decimal"
                              value={field.value}
                              onChange={field.onChange}
                            />
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="space-y-1">
                        <FieldLabel htmlFor={`debts.${idx}.annualAprPercent`}>Interest (APR %)</FieldLabel>
                        <Controller
                          control={control}
                          name={`debts.${idx}.annualAprPercent`}
                          render={({ field }) => (
                            <TextInput
                              id={`debts.${idx}.annualAprPercent`}
                              inputMode="decimal"
                              value={String(field.value)}
                              onChange={(v) => field.onChange(Number(v))}
                            />
                          )}
                        />
                      </div>

                      <div className="space-y-1">
                        <FieldLabel htmlFor={`debts.${idx}.startDateIso`}>Start date (optional)</FieldLabel>
                        <Controller
                          control={control}
                          name={`debts.${idx}.startDateIso`}
                          render={({ field }) => (
                            <DateInput
                              id={`debts.${idx}.startDateIso`}
                              value={field.value}
                              onChange={field.onChange}
                            />
                          )}
                        />
                        <FutureStartHint startDateIso={debts[idx]?.startDateIso} />
                      </div>

                      <div className="space-y-1">
                        <FieldLabel htmlFor={`debts.${idx}.payoffPlanKind`}>Payoff plan</FieldLabel>
                        <Controller
                          control={control}
                          name={`debts.${idx}.payoffPlanKind`}
                          render={({ field }) => (
                            <select
                              id={`debts.${idx}.payoffPlanKind`}
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              className={[
                                "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm",
                                "focus:outline-none focus:ring-2 focus:ring-slate-400",
                              ].join(" ")}
                            >
                              <option value="monthlyPayment">Monthly payment</option>
                              <option value="targetDate">Target payoff date</option>
                            </select>
                          )}
                        />
                      </div>
                    </div>

                    {planKind === "monthlyPayment" ? (
                      <div className="space-y-1">
                        <FieldLabel htmlFor={`debts.${idx}.monthlyPayment`}>Monthly payment</FieldLabel>
                        <Controller
                          control={control}
                          name={`debts.${idx}.monthlyPayment`}
                          render={({ field }) => (
                            <TextInput
                              id={`debts.${idx}.monthlyPayment`}
                              inputMode="decimal"
                              value={field.value}
                              onChange={field.onChange}
                            />
                          )}
                        />
                        <PaidOffByHint
                          amortization={amortization}
                          debt={debts[idx]}
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <FieldLabel htmlFor={`debts.${idx}.targetPayoffDateIso`}>Target payoff date</FieldLabel>
                        <Controller
                          control={control}
                          name={`debts.${idx}.targetPayoffDateIso`}
                          render={({ field }) => (
                            <DateInput
                              id={`debts.${idx}.targetPayoffDateIso`}
                              value={field.value}
                              onChange={field.onChange}
                            />
                          )}
                        />
                        <FieldErrorText
                          message={errors.debts?.[idx]?.targetPayoffDateIso?.message as any}
                        />
                        <ImpliedMonthlyPaymentHint amortization={amortization} debt={debts[idx]} />
                      </div>
                    )}

                    <CeilingRedirectInlinePicker
                      sourceKind="DebtLoan"
                      sourceId={debtId}
                      label="When this debt is paid off, redirect the freed monthly amount to"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <ReorderButtons
                      canMoveUp={idx > 0}
                      canMoveDown={idx < debtsArray.fields.length - 1}
                      onMoveUp={() => debtsArray.move(idx, idx - 1)}
                      onMoveDown={() => debtsArray.move(idx, idx + 1)}
                    />
                    <PrimaryButton onClick={() => debtsArray.remove(idx)}>Remove</PrimaryButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

class WizardIdFactory {
  public static create(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function PaidOffByHint(props: Readonly<{
  amortization: DebtAmortizationManager;
  debt: WizardFormInputValues["debts"][number] | undefined;
}>) {
  const d = props.debt;
  if (!d) return null;
  if (d.payoffPlanKind !== "monthlyPayment") return null;

  const balance = MoneyParser.tryParseCadOrZero(d.currentBalance).getCents();
  const payment = MoneyParser.tryParseCadOrZero(d.monthlyPayment).getCents();
  if (balance <= 0 || payment <= 0) return null;

  const startIso = (d.startDateIso && d.startDateIso.length > 0) ? d.startDateIso : DateMonthMath.currentMonthIso();
  const debtLike = {
    id: d.id,
    name: d.name,
    currentBalance: Money.fromCents(balance),
    annualApr: RateBps.fromPercent(d.annualAprPercent),
    startDateIso: startIso,
    payoffPlan: { kind: "monthlyPayment", monthlyPayment: Money.fromCents(payment) },
  } as const;

  const schedule = props.amortization.buildSchedule(debtLike as any, 80);
  if (schedule.payoffMonthIndex === null) return null;
  const payoffIso = DateMonthMath.addMonthsIso(DateMonthMath.currentMonthIso(), schedule.payoffMonthIndex);

  return (
    <p className="mt-1 text-xs text-slate-600">
      Paid off by: <span className="font-semibold text-slate-900">{payoffIso}</span>
    </p>
  );
}

function ImpliedMonthlyPaymentHint(props: Readonly<{
  amortization: DebtAmortizationManager;
  debt: WizardFormInputValues["debts"][number] | undefined;
}>) {
  const d = props.debt;
  if (!d) return null;
  if (d.payoffPlanKind !== "targetDate") return null;

  const balanceCents = MoneyParser.tryParseCadOrZero(d.currentBalance).getCents();
  if (balanceCents <= 0) return null;
  if (!d.targetPayoffDateIso || d.targetPayoffDateIso.length === 0) return null;

  const startIso =
    d.startDateIso && d.startDateIso.length > 0 ? d.startDateIso : DateMonthMath.currentMonthIso();
  const debtLike = {
    id: d.id,
    name: d.name,
    currentBalance: Money.fromCents(balanceCents),
    annualApr: RateBps.fromPercent(d.annualAprPercent),
    startDateIso: startIso,
    payoffPlan: { kind: "targetDate", targetPayoffDateIso: d.targetPayoffDateIso },
  } as const;

  const paymentCents = props.amortization.computeMonthlyPaymentFromDebt(debtLike as any).getCents();
  if (paymentCents <= 0) return null;

  return (
    <p className="mt-1 text-xs text-slate-600">
      Implied monthly payment:{" "}
      <span className="font-semibold text-slate-900">{Money.fromCents(paymentCents).formatCad()}/mo</span>
    </p>
  );
}

function FutureStartHint(props: Readonly<{ startDateIso: string | undefined }>) {
  const startIso = props.startDateIso;
  if (!startIso || startIso.length === 0) return null;

  const nowIso = DateMonthMath.currentMonthIso();
  let isFuture = false;
  try {
    isFuture = DateMonthMath.monthsBetweenIso(nowIso, startIso) > 0;
  } catch {
    isFuture = false;
  }
  if (!isFuture) return null;

  return (
    <p className="mt-1 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700">
      Starts <span className="ml-1 font-semibold text-slate-900">{DateMonthMath.formatMonYYYY(startIso)}</span>
    </p>
  );
}

