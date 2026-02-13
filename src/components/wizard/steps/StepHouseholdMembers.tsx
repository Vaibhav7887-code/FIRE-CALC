"use client";

import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { FieldErrorText } from "@/components/ui/FieldErrorText";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { TextInput } from "@/components/ui/TextInput";
import { WizardFormInputValues } from "@/components/wizard/WizardSchema";
import { TfsaLimitProvider } from "@/config/tfsa/tfsa-limits";

export function StepHouseholdMembers() {
  const {
    control,
    formState: { errors },
  } = useFormContext<WizardFormInputValues>();

  const membersArray = useFieldArray({ control, name: "members" });

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Add each person in your household. Taxes are estimated per person and then combined,
        which is more accurate than taxing the combined gross.
      </p>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Household members</h3>
        <SecondaryButton
          onClick={() =>
            membersArray.append({
              id: HouseholdMemberIdFactory.create(),
              displayName: "New member",
              employmentIncomeAnnual: "0",
              rrspContributionRoomAnnual: "0",
              tfsaRoomEntries: [],
            })
          }
        >
          + Add member
        </SecondaryButton>
      </div>

      <FieldErrorText message={(errors.members as any)?.message} />

      <div className="space-y-3">
        {membersArray.fields.map((m, idx) => (
          <div
            key={m.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <FieldLabel htmlFor={`members.${idx}.displayName`}>Name</FieldLabel>
                  <Controller
                    control={control}
                    name={`members.${idx}.displayName`}
                    render={({ field }) => (
                      <TextInput
                        id={`members.${idx}.displayName`}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  <FieldErrorText message={errors.members?.[idx]?.displayName?.message} />
                </div>

                <div className="space-y-1">
                  <FieldLabel htmlFor={`members.${idx}.employmentIncomeAnnual`}>
                    Employment income (annual gross)
                  </FieldLabel>
                  <Controller
                    control={control}
                    name={`members.${idx}.employmentIncomeAnnual`}
                    render={({ field }) => (
                      <TextInput
                        id={`members.${idx}.employmentIncomeAnnual`}
                        inputMode="decimal"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  <FieldErrorText message={errors.members?.[idx]?.employmentIncomeAnnual?.message} />
                </div>
              </div>

              <PrimaryButton
                disabled={membersArray.fields.length <= 1}
                onClick={() => membersArray.remove(idx)}
              >
                Remove
              </PrimaryButton>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <FieldLabel htmlFor={`members.${idx}.rrspContributionRoomAnnual`}>
                  RRSP contribution room (annual)
                </FieldLabel>
                <Controller
                  control={control}
                  name={`members.${idx}.rrspContributionRoomAnnual`}
                  render={({ field }) => (
                    <TextInput
                      id={`members.${idx}.rrspContributionRoomAnnual`}
                      inputMode="decimal"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <FieldErrorText
                  message={errors.members?.[idx]?.rrspContributionRoomAnnual?.message}
                />
              </div>
            </div>

            <TfsaRoomEditor memberIndex={idx} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TfsaRoomEditor(props: Readonly<{ memberIndex: number }>) {
  const { control, formState } = useFormContext<WizardFormInputValues>();
  const roomArray = useFieldArray({
    control,
    name: `members.${props.memberIndex}.tfsaRoomEntries`,
  });

  const addDefaultYear = () => {
    const currentYear = new Date().getFullYear();
    const existingYears = roomArray.fields.map((f) => (f as any).year as number).filter(Boolean);
    const nextYear = TfsaYearSequenceCalculator.nextDescendingYear(currentYear, existingYears);
    const limitProvider = new TfsaLimitProvider();
    const defaultLimit = limitProvider.getAnnualLimitDollars(nextYear);

    roomArray.append({
      year: nextYear,
      room: defaultLimit.toString(),
    });
  };

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">TFSA room entries</p>
        <SecondaryButton onClick={addDefaultYear}>
          + Add year
        </SecondaryButton>
      </div>
      <p className="mt-1 text-xs text-slate-600">
        Enter remaining room amounts you want to track per year (for warnings/validation).
      </p>

      {roomArray.fields.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">No TFSA room entered.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {roomArray.fields.map((f, ridx) => (
            <div key={f.id} className="grid grid-cols-1 gap-2 md:grid-cols-12">
              <div className="md:col-span-4">
                <FieldLabel htmlFor={`members.${props.memberIndex}.tfsaRoomEntries.${ridx}.year`}>
                  Year
                </FieldLabel>
                <Controller
                  control={control}
                  name={`members.${props.memberIndex}.tfsaRoomEntries.${ridx}.year`}
                  render={({ field }) => (
                    <TextInput
                      id={`members.${props.memberIndex}.tfsaRoomEntries.${ridx}.year`}
                      inputMode="numeric"
                      value={String(field.value)}
                      onChange={(v) => field.onChange(Number(v))}
                    />
                  )}
                />
                <FieldErrorText
                  message={
                    formState.errors.members?.[props.memberIndex]?.tfsaRoomEntries?.[ridx]?.year
                      ?.message
                  }
                />
              </div>

              <div className="md:col-span-6">
                <FieldLabel htmlFor={`members.${props.memberIndex}.tfsaRoomEntries.${ridx}.room`}>
                  Room amount
                </FieldLabel>
                <Controller
                  control={control}
                  name={`members.${props.memberIndex}.tfsaRoomEntries.${ridx}.room`}
                  render={({ field }) => (
                    <TextInput
                      id={`members.${props.memberIndex}.tfsaRoomEntries.${ridx}.room`}
                      inputMode="decimal"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <FieldErrorText
                  message={
                    formState.errors.members?.[props.memberIndex]?.tfsaRoomEntries?.[ridx]?.room
                      ?.message
                  }
                />
              </div>

              <div className="flex items-end md:col-span-2">
                <PrimaryButton onClick={() => roomArray.remove(ridx)}>Remove</PrimaryButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

class HouseholdMemberIdFactory {
  public static create(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

class TfsaYearSequenceCalculator {
  public static nextDescendingYear(currentYear: number, existingYears: ReadonlyArray<number>): number {
    const years = new Set(existingYears.filter((y) => Number.isFinite(y)));
    let candidate = currentYear;
    while (years.has(candidate)) candidate -= 1;
    return candidate;
  }
}

