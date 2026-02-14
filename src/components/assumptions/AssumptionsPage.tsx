"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { TextInput } from "@/components/ui/TextInput";
import { SessionAssumptionsUpdater } from "@/domain/managers/assumptions/SessionAssumptionsUpdater";
import { useBudgetSessionCoordinator, useBudgetSessionState } from "@/domain/coordinators/BudgetSessionCoordinatorProvider";

type Draft = Readonly<{
  taxYear: string;
  assumedInflationPercent: string;
  projectionHorizonYears: string;
}>;

export function AssumptionsPage() {
  const router = useRouter();
  const coordinator = useBudgetSessionCoordinator();
  const { currentSession } = useBudgetSessionState();
  const updater = useMemo(() => new SessionAssumptionsUpdater(), []);

  const [draft, setDraft] = useState<Draft>({ taxYear: "2026", assumedInflationPercent: "2", projectionHorizonYears: "30" });
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!currentSession) return;
    setDraft({
      taxYear: String(currentSession.locale.taxYear),
      assumedInflationPercent: String(currentSession.assumedAnnualInflation.toPercent()),
      projectionHorizonYears: String(currentSession.projectionHorizonYears),
    });
  }, [currentSession]);

  if (!currentSession) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Assumptions</h1>
        <p className="mt-2 text-slate-600">No session loaded. Start from the wizard.</p>
        <div className="mt-4">
          <PrimaryButton onClick={() => router.push("/")}>Go to wizard</PrimaryButton>
        </div>
      </main>
    );
  }

  const save = () => {
    const next = updater.applyDraft(currentSession, draft);
    coordinator.setCurrent(next);
    setSavedMessage("Saved.");
    window.setTimeout(() => setSavedMessage(null), 1500);
  };

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Assumptions</h1>
          <p className="mt-2 text-slate-600">Global knobs that affect projections and summaries.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SecondaryButton onClick={() => router.push("/dashboard")}>Back to dashboard</SecondaryButton>
          <PrimaryButton onClick={save}>Save changes</PrimaryButton>
        </div>
      </div>

      {savedMessage ? <p className="mt-3 text-sm font-semibold text-emerald-700">{savedMessage}</p> : null}

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <FieldLabel htmlFor="assumptions.taxYear">Tax year</FieldLabel>
            <TextInput
              id="assumptions.taxYear"
              inputMode="numeric"
              value={draft.taxYear}
              onChange={(v) => setDraft((d) => ({ ...d, taxYear: v }))}
            />
          </div>
          <div className="space-y-1">
            <FieldLabel htmlFor="assumptions.assumedInflationPercent">Assumed inflation (%)</FieldLabel>
            <TextInput
              id="assumptions.assumedInflationPercent"
              inputMode="decimal"
              value={draft.assumedInflationPercent}
              onChange={(v) => setDraft((d) => ({ ...d, assumedInflationPercent: v }))}
            />
          </div>
          <div className="space-y-1">
            <FieldLabel htmlFor="assumptions.projectionHorizonYears">Projection horizon (years)</FieldLabel>
            <TextInput
              id="assumptions.projectionHorizonYears"
              inputMode="numeric"
              value={draft.projectionHorizonYears}
              onChange={(v) => setDraft((d) => ({ ...d, projectionHorizonYears: v }))}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

