"use client";

import { useRouter } from "next/navigation";
import { WizardCard } from "@/components/wizard/WizardCard";
import { WizardStepperHeader } from "@/components/wizard/WizardStepperHeader";
import { WizardStepNavigator } from "@/components/wizard/WizardStepNavigator";
import { StepIncomeAssumptions } from "@/components/wizard/steps/StepIncomeAssumptions";
import { StepHouseholdMembers } from "@/components/wizard/steps/StepHouseholdMembers";
import { StepHouseholdBudget } from "@/components/wizard/steps/StepHouseholdBudget";
import { StepInvestments } from "@/components/wizard/steps/StepInvestments";
import { StepGoalFunds } from "@/components/wizard/steps/StepGoalFunds";
import { StepDebts } from "@/components/wizard/steps/StepDebts";
import { StepTemplates } from "@/components/wizard/steps/StepTemplates";
import { StepReview } from "@/components/wizard/steps/StepReview";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  wizardSchema,
  WizardFormInputValues,
  WizardFormValues,
} from "@/components/wizard/WizardSchema";
import { BudgetSessionFactory } from "@/domain/models/BudgetSession";
import { WizardDefaultsFactory } from "@/components/wizard/WizardDefaultsFactory";
import { WizardSessionMapper } from "@/domain/adapters/WizardSessionMapper";
import { useBudgetSessionCoordinator } from "@/domain/coordinators/BudgetSessionCoordinatorProvider";
import { useMemo, useState } from "react";

export function SetupWizardPage() {
  const router = useRouter();
  const coordinator = useBudgetSessionCoordinator();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = useMemo(
    () => [
      { title: "Assumptions", render: () => <StepIncomeAssumptions /> },
      { title: "Household members", render: () => <StepHouseholdMembers /> },
      { title: "Household expenses", render: () => <StepHouseholdBudget /> },
      { title: "Investments", render: () => <StepInvestments /> },
      { title: "Goals", render: () => <StepGoalFunds /> },
      { title: "Debts", render: () => <StepDebts /> },
      { title: "Templates", render: () => <StepTemplates /> },
      { title: "Review", render: () => <StepReview /> },
    ],
    [],
  );

  const form = useForm<WizardFormInputValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: WizardDefaultsFactory.fromSession(BudgetSessionFactory.createNew()),
    mode: "onBlur",
  });

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === steps.length - 1;

  const validateAndGoNext = async () => {
    const ok = await form.trigger(undefined, { shouldFocus: true });
    if (!ok) return;
    setCurrentStepIndex((i) => Math.min(steps.length - 1, i + 1));
  };

  const goBack = () => setCurrentStepIndex((i) => Math.max(0, i - 1));

  const submit = form.handleSubmit((values) => {
    const mapper = new WizardSessionMapper();
    const parsed: WizardFormValues = wizardSchema.parse(values);
    const session = mapper.map(parsed);
    coordinator.setOriginalAndCurrent(session);
    router.push("/dashboard");
  });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Budgeting calculator
        </h1>
        <p className="mt-2 text-slate-600">
          Enter your baseline numbers first. You can adjust allocations later on
          the dashboard.
        </p>
      </div>

      <WizardCard>
        <WizardStepperHeader steps={steps} currentIndex={currentStepIndex} />

        <FormProvider {...form}>
          <form onSubmit={submit}>
            <div className="mt-4">{steps[currentStepIndex]?.render()}</div>

            <WizardStepNavigator
              isFirst={isFirst}
              isLast={isLast}
              onBack={goBack}
              onNext={validateAndGoNext}
              isSubmitting={form.formState.isSubmitting}
            />
          </form>
        </FormProvider>
      </WizardCard>
    </main>
  );
}

