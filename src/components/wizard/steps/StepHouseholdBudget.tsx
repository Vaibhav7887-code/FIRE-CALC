"use client";

import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { FieldErrorText } from "@/components/ui/FieldErrorText";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { TextInput } from "@/components/ui/TextInput";
import { ReorderButtons } from "@/components/ui/ReorderButtons";
import { WizardFormInputValues } from "@/components/wizard/WizardSchema";
import { MoneyParser } from "@/domain/adapters/MoneyParser";
import { WizardCashflowSummaryCard } from "@/components/wizard/WizardCashflowSummaryCard";

class HouseholdMiscCalculator {
  public static calculateRemainderCents(
    allocatedMonthlyInput: string,
    categories: ReadonlyArray<{ monthlyAmount?: string }>,
  ): number {
    const allocated = MoneyParser.tryParseCadOrZero(allocatedMonthlyInput).getCents();
    const used = categories.reduce((sum, c) => {
      const amount = MoneyParser.tryParseCadOrZero(c.monthlyAmount).getCents();
      return sum + amount;
    }, 0);
    return allocated - used;
  }
}

export function StepHouseholdBudget() {
  const {
    control,
    formState: { errors },
  } = useFormContext<WizardFormInputValues>();

  const { fields, prepend, remove, move } = useFieldArray({
    control,
    name: "householdCategories",
  });

  const allocatedMonthly = useWatch({ control, name: "householdAllocatedMonthly" });
  const categories = useWatch({ control, name: "householdCategories" }) ?? [];
  const remainderCents = HouseholdMiscCalculator.calculateRemainderCents(
    allocatedMonthly,
    categories,
  );

  return (
    <div className="space-y-4">
      <WizardCashflowSummaryCard />
      <div className="space-y-1">
        <FieldLabel htmlFor="householdAllocatedMonthly">
          Household expenses allocated (monthly)
        </FieldLabel>
        <Controller
          control={control}
          name="householdAllocatedMonthly"
          render={({ field }) => (
            <TextInput
              id="householdAllocatedMonthly"
              inputMode="decimal"
              placeholder="4000"
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <FieldErrorText message={errors.householdAllocatedMonthly?.message} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm text-slate-700">
          Misc remainder:{" "}
          <span className={remainderCents < 0 ? "font-bold text-red-700" : "font-bold"}>
            ${(remainderCents / 100).toFixed(2)}
          </span>
        </p>
        <p className="mt-1 text-xs text-slate-600">
          Add categories below. The remainder is what you haven’t allocated yet.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Breakdown</h3>
          <SecondaryButton
            onClick={() => prepend({ name: "", monthlyAmount: "" })}
          >
            + Add category
          </SecondaryButton>
        </div>

        {fields.length === 0 ? (
          <p className="text-sm text-slate-600">No categories yet (everything stays in Misc).</p>
        ) : (
          <div className="space-y-2">
            {fields.map((f, idx) => (
              <div
                key={f.id}
                className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-12"
              >
                <div className="md:col-span-6">
                  <FieldLabel htmlFor={`householdCategories.${idx}.name`}>Name</FieldLabel>
                  <Controller
                    control={control}
                    name={`householdCategories.${idx}.name`}
                    render={({ field }) => (
                      <TextInput
                        id={`householdCategories.${idx}.name`}
                        placeholder="Rent"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  <FieldErrorText message={errors.householdCategories?.[idx]?.name?.message} />
                </div>
                <div className="md:col-span-4">
                  <FieldLabel htmlFor={`householdCategories.${idx}.monthlyAmount`}>
                    Monthly amount
                  </FieldLabel>
                  <Controller
                    control={control}
                    name={`householdCategories.${idx}.monthlyAmount`}
                    render={({ field }) => (
                      <TextInput
                        id={`householdCategories.${idx}.monthlyAmount`}
                        inputMode="decimal"
                        placeholder="2000"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  <FieldErrorText
                    message={errors.householdCategories?.[idx]?.monthlyAmount?.message}
                  />
                </div>
                <div className="flex items-end justify-end gap-2 md:col-span-2">
                  <ReorderButtons
                    canMoveUp={idx > 0}
                    canMoveDown={idx < fields.length - 1}
                    onMoveUp={() => move(idx, idx - 1)}
                    onMoveDown={() => move(idx, idx + 1)}
                  />
                  <PrimaryButton onClick={() => remove(idx)}>Remove</PrimaryButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {remainderCents < 0 ? (
        <p className="text-sm font-semibold text-red-700">
          Your categories exceed the allocated household total. Reduce some category amounts.
        </p>
      ) : null}
    </div>
  );
}

