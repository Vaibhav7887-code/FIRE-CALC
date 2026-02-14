"use client";

import { FieldLabel } from "@/components/ui/FieldLabel";
import { TextInput } from "@/components/ui/TextInput";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { ReorderButtons } from "@/components/ui/ReorderButtons";
import { HouseholdExpenseCategoryDraft } from "@/domain/viewmodels/HouseholdExpensesViewData";

type Props = Readonly<{
  allocatedMonthly: string;
  categories: ReadonlyArray<HouseholdExpenseCategoryDraft>;
  remainderCents: number;
  onChangeAllocatedMonthly: (next: string) => void;
  onChangeCategoryName: (categoryId: string, next: string) => void;
  onChangeCategoryMonthlyAmount: (categoryId: string, next: string) => void;
  onAddCategory: () => void;
  onRemoveCategory: (categoryId: string) => void;
  onMoveCategoryUp: (categoryId: string) => void;
  onMoveCategoryDown: (categoryId: string) => void;
}>;

export function HouseholdExpenseCategoriesEditor(props: Props) {
  return (
    <div className="space-y-4" data-testid="household-expenses-editor">
      <div className="space-y-1">
        <FieldLabel htmlFor="householdAllocatedMonthly">Household expenses allocated (monthly)</FieldLabel>
        <TextInput
          id="householdAllocatedMonthly"
          inputMode="decimal"
          placeholder="4000"
          value={props.allocatedMonthly}
          onChange={props.onChangeAllocatedMonthly}
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm text-slate-700">
          Misc remainder:{" "}
          <span className={props.remainderCents < 0 ? "font-bold text-red-700" : "font-bold"}>
            ${(props.remainderCents / 100).toFixed(2)}
          </span>
        </p>
        <p className="mt-1 text-xs text-slate-600">
          Add categories below. The remainder is what you haven’t allocated yet.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Breakdown</h3>
          <SecondaryButton onClick={props.onAddCategory}>Add category</SecondaryButton>
        </div>

        {props.categories.length === 0 ? (
          <p className="text-sm text-slate-600">No categories yet (everything stays in Misc).</p>
        ) : (
          <div className="space-y-2">
            {props.categories.map((c, idx) => (
              <div
                key={c.id}
                className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-12"
                data-testid="household-expense-category-row"
              >
                <div className="md:col-span-6">
                  <FieldLabel htmlFor={`householdCategory.${c.id}.name`}>Category name</FieldLabel>
                  <TextInput
                    id={`householdCategory.${c.id}.name`}
                    placeholder="Rent"
                    value={c.name}
                    onChange={(v) => props.onChangeCategoryName(c.id, v)}
                  />
                </div>
                <div className="md:col-span-4">
                  <FieldLabel htmlFor={`householdCategory.${c.id}.monthlyAmount`}>Monthly amount</FieldLabel>
                  <TextInput
                    id={`householdCategory.${c.id}.monthlyAmount`}
                    inputMode="decimal"
                    placeholder="2000"
                    value={c.monthlyAmount}
                    onChange={(v) => props.onChangeCategoryMonthlyAmount(c.id, v)}
                  />
                </div>
                <div className="flex items-end justify-end gap-2 md:col-span-2">
                  <ReorderButtons
                    canMoveUp={idx > 0}
                    canMoveDown={idx < props.categories.length - 1}
                    onMoveUp={() => props.onMoveCategoryUp(c.id)}
                    onMoveDown={() => props.onMoveCategoryDown(c.id)}
                  />
                  <PrimaryButton onClick={() => props.onRemoveCategory(c.id)}>Remove</PrimaryButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {props.remainderCents < 0 ? (
        <p className="text-sm font-semibold text-red-700">
          Your categories exceed the allocated household total. Reduce some category amounts.
        </p>
      ) : null}
    </div>
  );
}

