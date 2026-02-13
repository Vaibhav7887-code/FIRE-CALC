"use client";

import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { FieldErrorText } from "@/components/ui/FieldErrorText";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { TextInput } from "@/components/ui/TextInput";
import { ReorderButtons } from "@/components/ui/ReorderButtons";
import { WizardFormInputValues } from "@/components/wizard/WizardSchema";

type TemplateKind = WizardFormInputValues["templates"][number]["kind"];

class TemplateDefaultsFactory {
  public static create(kind: TemplateKind): WizardFormInputValues["templates"][number] {
    const nameByKind: Record<TemplateKind, string> = {
      ChildFund: "Child fund",
      Travel: "Travel",
      Trust: "Trust",
      LargePurchase: "Large purchase",
    };
    return {
      kind,
      name: nameByKind[kind],
      monthlyAllocation: "0",
      expectedAnnualReturnPercent: 5,
    };
  }
}

export function StepTemplates() {
  const {
    control,
    formState: { errors },
  } = useFormContext<WizardFormInputValues>();

  const templatesArray = useFieldArray({ control, name: "templates" });

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Add optional planning buckets. These behave like their own “funds” and will show
        up in the dashboard allocation slider and charts.
      </p>

      <div className="flex flex-wrap gap-2">
        {(["ChildFund", "Travel", "Trust", "LargePurchase"] as const).map((kind) => (
          <SecondaryButton
            key={kind}
            onClick={() => templatesArray.prepend(TemplateDefaultsFactory.create(kind))}
          >
            + {TemplateDefaultsFactory.create(kind).name}
          </SecondaryButton>
        ))}
      </div>

      {templatesArray.fields.length === 0 ? (
        <p className="text-sm text-slate-600">No templates added.</p>
      ) : (
        <div className="space-y-3">
          {templatesArray.fields.map((f, idx) => (
            <div
              key={f.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-full space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <FieldLabel htmlFor={`templates.${idx}.name`}>Name</FieldLabel>
                      <Controller
                        control={control}
                        name={`templates.${idx}.name`}
                        render={({ field }) => (
                          <TextInput
                            id={`templates.${idx}.name`}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <FieldErrorText message={errors.templates?.[idx]?.name?.message} />
                    </div>
                    <div className="space-y-1">
                      <FieldLabel htmlFor={`templates.${idx}.expectedAnnualReturnPercent`}>
                        Expected return (% annual)
                      </FieldLabel>
                      <Controller
                        control={control}
                        name={`templates.${idx}.expectedAnnualReturnPercent`}
                        render={({ field }) => (
                          <TextInput
                            id={`templates.${idx}.expectedAnnualReturnPercent`}
                            inputMode="decimal"
                            value={String(field.value)}
                            onChange={(v) => field.onChange(Number(v))}
                          />
                        )}
                      />
                      <FieldErrorText
                        message={errors.templates?.[idx]?.expectedAnnualReturnPercent?.message}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <FieldLabel htmlFor={`templates.${idx}.monthlyAllocation`}>
                      Monthly allocation
                    </FieldLabel>
                    <Controller
                      control={control}
                      name={`templates.${idx}.monthlyAllocation`}
                      render={({ field }) => (
                        <TextInput
                          id={`templates.${idx}.monthlyAllocation`}
                          inputMode="decimal"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ReorderButtons
                    canMoveUp={idx > 0}
                    canMoveDown={idx < templatesArray.fields.length - 1}
                    onMoveUp={() => templatesArray.move(idx, idx - 1)}
                    onMoveDown={() => templatesArray.move(idx, idx + 1)}
                  />
                  <PrimaryButton onClick={() => templatesArray.remove(idx)}>Remove</PrimaryButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

