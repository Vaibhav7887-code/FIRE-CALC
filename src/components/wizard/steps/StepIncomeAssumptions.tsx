"use client";

import { Controller, useFormContext } from "react-hook-form";
import { FieldErrorText } from "@/components/ui/FieldErrorText";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { TextInput } from "@/components/ui/TextInput";
import { WizardFormInputValues } from "@/components/wizard/WizardSchema";

export function StepIncomeAssumptions() {
  const {
    control,
    formState: { errors },
  } = useFormContext<WizardFormInputValues>();

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <FieldLabel htmlFor="locale.taxYear">Tax year</FieldLabel>
        <Controller
          control={control}
          name="locale.taxYear"
          render={({ field }) => (
            <TextInput
              id="locale.taxYear"
              inputMode="numeric"
              placeholder="2026"
              value={String(field.value)}
              onChange={(v) => field.onChange(Number(v))}
            />
          )}
        />
        <FieldErrorText message={errors.locale?.taxYear?.message} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <FieldLabel htmlFor="assumedInflationPercent">Assumed inflation (%)</FieldLabel>
          <Controller
            control={control}
            name="assumedInflationPercent"
            render={({ field }) => (
              <TextInput
                id="assumedInflationPercent"
                inputMode="decimal"
                placeholder="2"
                value={String(field.value)}
                onChange={(v) => field.onChange(Number(v))}
              />
            )}
          />
          <FieldErrorText message={errors.assumedInflationPercent?.message} />
        </div>

        <div className="space-y-1">
          <FieldLabel htmlFor="projectionHorizonYears">Projection horizon (years)</FieldLabel>
          <Controller
            control={control}
            name="projectionHorizonYears"
            render={({ field }) => (
              <TextInput
                id="projectionHorizonYears"
                inputMode="numeric"
                placeholder="30"
                value={String(field.value)}
                onChange={(v) => field.onChange(Number(v))}
              />
            )}
          />
          <FieldErrorText message={errors.projectionHorizonYears?.message} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">Cash + luxury</p>
          <p className="mt-1 text-sm text-slate-600">
            These are modeled as goal-based sinking funds now (Emergency fund, Vacation, etc.).
            You’ll set them in the Goals step.
          </p>
        </div>
      </div>

      <p className="text-sm text-slate-600">
        V1 uses an approximate Canada + BC tax engine (RRSP reduces taxable income, TFSA
        does not). You can still work with gross numbers if you prefer—net will be
        displayed as an estimate.
      </p>
    </div>
  );
}

