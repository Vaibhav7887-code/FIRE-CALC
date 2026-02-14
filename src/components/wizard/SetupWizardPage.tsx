"use client";

import { useRouter } from "next/navigation";
import { WizardCard } from "@/components/wizard/WizardCard";
import { WizardStepperHeader } from "@/components/wizard/WizardStepperHeader";
import { WizardStepNavigator } from "@/components/wizard/WizardStepNavigator";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
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
import { useEffect, useMemo, useState } from "react";
import { WizardDraftStorageManager } from "@/domain/managers/storage/WizardDraftStorageManager";
import { DashboardCreatedFlagStorageManager } from "@/domain/managers/storage/DashboardCreatedFlagStorageManager";
import { SessionStorageManager } from "@/domain/managers/storage/SessionStorageManager";
import { WizardDraftValuesNormalizer } from "@/components/wizard/WizardDraftValuesNormalizer";

export function SetupWizardPage() {
  const router = useRouter();
  const coordinator = useBudgetSessionCoordinator();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [didRestoreDraft, setDidRestoreDraft] = useState(false);
  const [pendingRestore, setPendingRestore] = useState(false);
  const [returningUserGate, setReturningUserGate] = useState(false);

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

  const initialDefaults = useMemo(
    () => WizardDefaultsFactory.fromSession(BudgetSessionFactory.createNew()),
    [],
  );

  const form = useForm<WizardFormInputValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: initialDefaults,
    mode: "onBlur",
  });

  const wizardDraftStorage = useMemo(() => new WizardDraftStorageManager(), []);
  const dashboardFlag = useMemo(() => new DashboardCreatedFlagStorageManager(), []);
  const sessionStorage = useMemo(() => new SessionStorageManager(), []);

  useEffect(() => {
    // Returning users with an existing dashboard should get an explicit entrypoint choice.
    if (dashboardFlag.isCreated()) setReturningUserGate(true);
  }, [dashboardFlag]);

  useEffect(() => {
    const draft = wizardDraftStorage.load();
    if (!draft) return;

    // If the user already has a created dashboard, require explicit confirmation to resume a wizard draft.
    if (dashboardFlag.isCreated()) {
      setPendingRestore(true);
      return;
    }

    const clampedStep = Math.max(0, Math.min(steps.length - 1, Math.round(draft.stepIndex)));
    form.reset(WizardDraftValuesNormalizer.normalize(draft.values));
    setCurrentStepIndex(clampedStep);
    setDidRestoreDraft(true);
  }, [dashboardFlag, form, steps.length, wizardDraftStorage]);

  useEffect(() => {
    // Persist draft values continuously to prevent data loss on refresh.
    const sub = form.watch((values) => {
      wizardDraftStorage.save({
        version: 1,
        savedAtIso: new Date().toISOString(),
        stepIndex: currentStepIndex,
        values: values as WizardFormInputValues,
      });
    });
    return () => sub.unsubscribe();
  }, [currentStepIndex, form, wizardDraftStorage]);

  useEffect(() => {
    // Persist step index transitions even if values haven't changed.
    wizardDraftStorage.save({
      version: 1,
      savedAtIso: new Date().toISOString(),
      stepIndex: currentStepIndex,
      values: form.getValues(),
    });
  }, [currentStepIndex, form, wizardDraftStorage]);

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === steps.length - 1;

  const stepValidationFields: ReadonlyArray<ReadonlyArray<keyof WizardFormInputValues> | null> = useMemo(
    () => [
      ["locale", "assumedInflationPercent", "projectionHorizonYears"],
      ["members"],
      ["householdAllocatedMonthly", "householdCategories"],
      ["investments"],
      ["goalFunds"],
      ["debts"],
      ["templates"],
      null, // Review: full-form validation occurs on submit
    ],
    [],
  );

  const validateAndGoNext = async () => {
    const fields = stepValidationFields[currentStepIndex] ?? null;
    const ok = await form.trigger(fields ?? undefined, { shouldFocus: true });
    if (!ok) return;
    setCurrentStepIndex((i) => Math.min(steps.length - 1, i + 1));
  };

  const goBack = () => setCurrentStepIndex((i) => Math.max(0, i - 1));

  const submit = form.handleSubmit((values) => {
    const mapper = new WizardSessionMapper();
    const parsed: WizardFormValues = wizardSchema.parse(values);
    const session = mapper.map(parsed);
    coordinator.setOriginalAndCurrent(session);
    dashboardFlag.setCreated();
    wizardDraftStorage.clear();
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
        {returningUserGate ? (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">You have an existing plan</h2>
            <p className="text-sm text-slate-600">
              Choose whether you want to resume your dashboard session or start a brand new plan.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <SecondaryButton onClick={() => router.push("/dashboard")}>Go to dashboard</SecondaryButton>
              <PrimaryButton
                type="button"
                onClick={() => {
                  // Starting a new plan clears the saved dashboard session and any wizard draft.
                  sessionStorage.clear();
                  dashboardFlag.clear();
                  wizardDraftStorage.clear();
                  coordinator.startNew();
                  form.reset(initialDefaults);
                  setCurrentStepIndex(0);
                  setDidRestoreDraft(false);
                  setPendingRestore(false);
                  setReturningUserGate(false);
                }}
              >
                Start a new plan
              </PrimaryButton>
            </div>
          </div>
        ) : (
          <>
            <WizardStepperHeader steps={steps} currentIndex={currentStepIndex} />

            <FormProvider {...form}>
              <form onSubmit={submit}>
            {pendingRestore ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-amber-900">Resume your in-progress setup?</p>
                  <button
                    type="button"
                    className="text-xs font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-950"
                    onClick={() => {
                      const draft = wizardDraftStorage.load();
                      if (!draft) {
                        setPendingRestore(false);
                        return;
                      }
                      const clampedStep = Math.max(0, Math.min(steps.length - 1, Math.round(draft.stepIndex)));
                      form.reset(WizardDraftValuesNormalizer.normalize(draft.values));
                      setCurrentStepIndex(clampedStep);
                      setDidRestoreDraft(true);
                      setPendingRestore(false);
                    }}
                  >
                    Resume setup
                  </button>
                </div>
                <p className="mt-1 text-xs text-amber-800">
                  You already have a saved dashboard session. Resuming will not overwrite it until you create a new dashboard.
                </p>
                <div className="mt-2">
                  <button
                    type="button"
                    className="text-xs font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-950"
                    onClick={() => {
                      wizardDraftStorage.clear();
                      setPendingRestore(false);
                    }}
                  >
                    Discard draft
                  </button>
                </div>
              </div>
            ) : null}

            {didRestoreDraft ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-amber-900">Resumed your in-progress setup.</p>
                  <button
                    type="button"
                    className="text-xs font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-950"
                    onClick={() => {
                      wizardDraftStorage.clear();
                      form.reset(initialDefaults);
                      setCurrentStepIndex(0);
                      setDidRestoreDraft(false);
                    }}
                  >
                    Start over
                  </button>
                </div>
                <p className="mt-1 text-xs text-amber-800">
                  Refresh-safe draft save is enabled for this wizard.
                </p>
              </div>
            ) : null}

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
          </>
        )}
      </WizardCard>
    </main>
  );
}

