"use client";

import React from "react";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { CheckboxInput } from "@/components/ui/CheckboxInput";
import { FieldErrorText } from "@/components/ui/FieldErrorText";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { TextInput } from "@/components/ui/TextInput";
import { ReorderButtons } from "@/components/ui/ReorderButtons";
import { DateInput } from "@/components/ui/DateInput";
import { WizardFormInputValues } from "@/components/wizard/WizardSchema";
import { WizardCashflowSummaryCard } from "@/components/wizard/WizardCashflowSummaryCard";
import { CeilingRedirectInlinePicker } from "@/components/wizard/CeilingRedirectInlinePicker";
import { RegisteredRoomManager } from "@/domain/managers/registered/RegisteredRoomManager";
import { Money } from "@/domain/models/Money";
import { MoneyParser } from "@/domain/adapters/MoneyParser";

class InvestmentLabelFactory {
  public static kindLabel(kind: WizardFormInputValues["investments"][number]["kind"]): string {
    if (kind === "TFSA") return "TFSA";
    if (kind === "RRSP") return "RRSP";
    return "Custom";
  }
}

class WizardIdFactory {
  public static create(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

export function StepInvestments() {
  const {
    control,
    formState: { errors },
  } = useFormContext<WizardFormInputValues>();

  const investmentsArray = useFieldArray({ control, name: "investments" });
  const investments = useWatch({ control, name: "investments" }) ?? [];
  const members = useWatch({ control, name: "members" }) ?? [];
  const taxYear = useWatch({ control, name: "locale.taxYear" });

  const roomManager = new RegisteredRoomManager();

  const [newKind, setNewKind] = React.useState<
    WizardFormInputValues["investments"][number]["kind"]
  >("TFSA");
  const [newOwnerId, setNewOwnerId] = React.useState<string>(() => members[0]?.id ?? "");

  const addInvestment = () => {
    const kind = newKind;
    const requiresOwner = kind === "TFSA" || kind === "RRSP";
    const ownerMemberId = requiresOwner ? newOwnerId : undefined;

    investmentsArray.prepend({
      id: WizardIdFactory.create(),
      kind,
      name: kind === "Custom" ? "Custom investment" : kind,
      ownerMemberId,
      startingBalance: "0",
      monthlyContribution: "0",
      startDateIso: undefined,
      isRecurringMonthly: true,
      expectedAnnualReturnPercent: 6,
      backfillContributions: [],
    });
  };

  return (
    <div className="space-y-4">
      <WizardCashflowSummaryCard />
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Add buckets like TFSA/RRSP. You can add custom buckets too.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Add an investment bucket</p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-4">
            <FieldLabel htmlFor="newInvestmentKind">Type</FieldLabel>
            <select
              id="newInvestmentKind"
              value={newKind}
              onChange={(e) => setNewKind(e.target.value as any)}
              className={[
                "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-slate-400",
              ].join(" ")}
            >
              <option value="TFSA">TFSA</option>
              <option value="RRSP">RRSP</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div className="md:col-span-5">
            <FieldLabel htmlFor="newInvestmentOwner">Owner (TFSA/RRSP)</FieldLabel>
            <select
              id="newInvestmentOwner"
              value={newOwnerId}
              onChange={(e) => setNewOwnerId(e.target.value)}
              disabled={!(newKind === "TFSA" || newKind === "RRSP")}
              className={[
                "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-slate-400",
                "disabled:bg-slate-100",
              ].join(" ")}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end md:col-span-3">
            <SecondaryButton onClick={addInvestment}>+ Add</SecondaryButton>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {investmentsArray.fields.map((f, idx) => {
          const kind = investments[idx]?.kind ?? f.kind;
          const isTfsa = kind === "TFSA";
          const isRrsp = kind === "RRSP";
          const requiresOwner = isTfsa || isRrsp;

          return (
            <div
              key={f.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {InvestmentLabelFactory.kindLabel(kind)}
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <FieldLabel htmlFor={`investments.${idx}.name`}>Bucket name</FieldLabel>
                      <Controller
                        control={control}
                        name={`investments.${idx}.name`}
                        render={({ field }) => (
                          <TextInput
                            id={`investments.${idx}.name`}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <FieldErrorText message={errors.investments?.[idx]?.name?.message} />
                    </div>

                    <div className="space-y-1">
                      <FieldLabel htmlFor={`investments.${idx}.expectedAnnualReturnPercent`}>
                        Expected return (% annual)
                      </FieldLabel>
                      <Controller
                        control={control}
                        name={`investments.${idx}.expectedAnnualReturnPercent`}
                        render={({ field }) => (
                          <TextInput
                            id={`investments.${idx}.expectedAnnualReturnPercent`}
                            inputMode="decimal"
                            value={String(field.value)}
                            onChange={(v) => field.onChange(Number(v))}
                          />
                        )}
                      />
                      <FieldErrorText
                        message={errors.investments?.[idx]?.expectedAnnualReturnPercent?.message}
                      />
                    </div>
                  </div>

                  {requiresOwner ? (
                    <div className="mt-3 space-y-1">
                      <FieldLabel htmlFor={`investments.${idx}.ownerMemberId`}>Owner</FieldLabel>
                      <Controller
                        control={control}
                        name={`investments.${idx}.ownerMemberId`}
                        render={({ field }) => (
                          <select
                            id={`investments.${idx}.ownerMemberId`}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value)}
                            className={[
                              "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm",
                              "focus:outline-none focus:ring-2 focus:ring-slate-400",
                            ].join(" ")}
                          >
                            <option value="" disabled>
                              Select owner
                            </option>
                            {members.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.displayName}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                      <FieldErrorText message={errors.investments?.[idx]?.ownerMemberId?.message as any} />
                      <p className="text-xs text-slate-600">
                        RRSP contributions affect the owner’s tax estimate.
                      </p>
                      <OwnerRoomSummary
                        kind={kind}
                        ownerMemberId={investments[idx]?.ownerMemberId}
                        members={members}
                        investments={investments}
                        taxYear={taxYear}
                        roomManager={roomManager}
                      />
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <ReorderButtons
                    canMoveUp={idx > 0}
                    canMoveDown={idx < investmentsArray.fields.length - 1}
                    onMoveUp={() => investmentsArray.move(idx, idx - 1)}
                    onMoveDown={() => investmentsArray.move(idx, idx + 1)}
                  />
                  <PrimaryButton onClick={() => investmentsArray.remove(idx)}>Remove</PrimaryButton>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <FieldLabel htmlFor={`investments.${idx}.startingBalance`}>Starting balance</FieldLabel>
                  <Controller
                    control={control}
                    name={`investments.${idx}.startingBalance`}
                    render={({ field }) => (
                      <TextInput
                        id={`investments.${idx}.startingBalance`}
                        inputMode="decimal"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <FieldLabel htmlFor={`investments.${idx}.monthlyContribution`}>
                    Monthly contribution
                  </FieldLabel>
                  <Controller
                    control={control}
                    name={`investments.${idx}.monthlyContribution`}
                    render={({ field }) => (
                      <TextInput
                        id={`investments.${idx}.monthlyContribution`}
                        inputMode="decimal"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-800">Backfill (for room)</p>
                  <p className="mt-1 text-xs text-slate-600">
                    Use backfill contributions to represent past contributions that should reduce room.
                    They do not affect monthly cashflow and should already be included in starting balance.
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-1">
                <FieldLabel htmlFor={`investments.${idx}.startDateIso`}>Start date (optional)</FieldLabel>
                <Controller
                  control={control}
                  name={`investments.${idx}.startDateIso`}
                  render={({ field }) => (
                    <DateInput
                      id={`investments.${idx}.startDateIso`}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              {(isTfsa || isRrsp) ? (
                <BackfillEditor investmentIndex={idx} defaultYear={taxYear} />
              ) : null}

              {(isTfsa || isRrsp) ? (
                <CeilingRedirectInlinePicker
                  sourceKind="RegisteredRoomCeiling"
                  sourceId={(investments[idx]?.id ?? (f as any).id) as string}
                  label="When room runs out, redirect the freed monthly amount to"
                />
              ) : null}

              <div className="mt-3 flex items-center gap-2">
                <Controller
                  control={control}
                  name={`investments.${idx}.isRecurringMonthly`}
                  render={({ field }) => (
                    <CheckboxInput
                      id={`investments.${idx}.isRecurringMonthly`}
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <FieldLabel htmlFor={`investments.${idx}.isRecurringMonthly`}>
                  Recurring monthly contributions
                </FieldLabel>
              </div>

              {isTfsa ? (
                <p className="mt-4 text-xs text-slate-600">
                  TFSA room is tracked per household member (see “Household members” step).
                </p>
              ) : null}
              {isRrsp ? (
                <p className="mt-2 text-xs text-slate-600">
                  RRSP room is tracked per household member (see “Household members” step).
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BackfillEditor(props: Readonly<{ investmentIndex: number; defaultYear: number }>) {
  const { control, formState } = useFormContext<WizardFormInputValues>();
  const backfillArray = useFieldArray({
    control,
    name: `investments.${props.investmentIndex}.backfillContributions`,
  });

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Backfill contributions</p>
        <SecondaryButton
          onClick={() => backfillArray.append({ year: props.defaultYear, amount: "0" })}
        >
          + Add backfill
        </SecondaryButton>
      </div>
      {backfillArray.fields.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">No backfill entries.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {backfillArray.fields.map((f, bidx) => (
            <div key={f.id} className="grid grid-cols-1 gap-2 md:grid-cols-12">
              <div className="md:col-span-4">
                <FieldLabel htmlFor={`investments.${props.investmentIndex}.backfillContributions.${bidx}.year`}>
                  Year
                </FieldLabel>
                <Controller
                  control={control}
                  name={`investments.${props.investmentIndex}.backfillContributions.${bidx}.year`}
                  render={({ field }) => (
                    <TextInput
                      id={`investments.${props.investmentIndex}.backfillContributions.${bidx}.year`}
                      inputMode="numeric"
                      value={String(field.value)}
                      onChange={(v) => field.onChange(Number(v))}
                    />
                  )}
                />
                <FieldErrorText
                  message={
                    formState.errors.investments?.[props.investmentIndex]?.backfillContributions?.[bidx]?.year
                      ?.message as any
                  }
                />
              </div>

              <div className="md:col-span-6">
                <FieldLabel htmlFor={`investments.${props.investmentIndex}.backfillContributions.${bidx}.amount`}>
                  Amount
                </FieldLabel>
                <Controller
                  control={control}
                  name={`investments.${props.investmentIndex}.backfillContributions.${bidx}.amount`}
                  render={({ field }) => (
                    <TextInput
                      id={`investments.${props.investmentIndex}.backfillContributions.${bidx}.amount`}
                      inputMode="decimal"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="flex items-end md:col-span-2">
                <PrimaryButton onClick={() => backfillArray.remove(bidx)}>Remove</PrimaryButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OwnerRoomSummary(props: Readonly<{
  kind: WizardFormInputValues["investments"][number]["kind"];
  ownerMemberId?: string;
  members: WizardFormInputValues["members"];
  investments: WizardFormInputValues["investments"];
  taxYear: number;
  roomManager: RegisteredRoomManager;
}>) {
  if (!props.ownerMemberId) return null;

  const member = props.members.find((m) => m.id === props.ownerMemberId);
  if (!member) return null;

  // Build a tiny session-like shape for this manager (keeps SRP).
  const sessionLike = {
    locale: { taxYear: props.taxYear },
    members: [
      {
        id: member.id,
        displayName: member.displayName,
        employmentIncomeAnnual: Money.zero(),
        tfsaRoomEntries: member.tfsaRoomEntries.map((e) => ({
          year: e.year,
          room: MoneyParser.tryParseCadOrZero(e.room),
        })),
        rrspContributionRoomAnnual: MoneyParser.tryParseCadOrZero(member.rrspContributionRoomAnnual),
      },
    ],
    investments: props.investments.map((b) => ({
      kind: b.kind as any,
      ownerMemberId: b.ownerMemberId,
      monthlyContribution: MoneyParser.tryParseCadOrZero(b.monthlyContribution),
      isRecurringMonthly: b.isRecurringMonthly,
      startDateIso: b.startDateIso,
      backfillContributions: (b.backfillContributions ?? []).map((e) => ({
        year: e.year,
        amount: MoneyParser.tryParseCadOrZero(e.amount),
      })),
    })),
  } as any;

  const summary = props.roomManager.buildForMember(
    sessionLike,
    sessionLike.members[0],
    props.taxYear,
  );

  const isTfsa = props.kind === "TFSA";
  const label = isTfsa ? "TFSA room" : "RRSP room";
  const accrued = isTfsa ? summary.tfsaAccruedRoomCents : summary.rrspAccruedRoomCents;
  const used = isTfsa ? summary.tfsaUsedTotalCents : summary.rrspUsedTotalCents;
  const remaining = isTfsa ? summary.tfsaRemainingCents : summary.rrspRemainingCents;

  return (
    <div className="mt-2 rounded-lg border border-slate-200 bg-white p-2">
      <p className="text-xs text-slate-700">
        <span className="font-semibold">{label} (tracked):</span>{" "}
        Accrued ${Math.round(accrued / 100).toLocaleString()} • Used ${Math.round(used / 100).toLocaleString()} •{" "}
        <span className={remaining <= 0 ? "font-semibold text-red-700" : "font-semibold"}>
          Remaining ${Math.round(remaining / 100).toLocaleString()}
        </span>
      </p>
      <p className="mt-1 text-[11px] text-slate-600">
        “Accrued” is the sum of the room entries you added for this member. “Used” includes all backfill entries (any year) plus recurring contributions annualized for the selected tax year.
      </p>
    </div>
  );
}
