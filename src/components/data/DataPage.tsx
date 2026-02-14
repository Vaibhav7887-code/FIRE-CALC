"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { SessionExcelExportButton } from "@/components/dashboard/SessionExcelExportButton";
import { SessionJsonControls } from "@/components/dashboard/SessionJsonControls";
import { useBudgetSessionCoordinator, useBudgetSessionState } from "@/domain/coordinators/BudgetSessionCoordinatorProvider";
import { DashboardCreatedFlagStorageManager } from "@/domain/managers/storage/DashboardCreatedFlagStorageManager";
import { WizardDraftStorageManager } from "@/domain/managers/storage/WizardDraftStorageManager";
import { SessionStorageManager } from "@/domain/managers/storage/SessionStorageManager";

export function DataPage() {
  const router = useRouter();
  const coordinator = useBudgetSessionCoordinator();
  const { originalSession, currentSession } = useBudgetSessionState();

  const dashboardFlag = useMemo(() => new DashboardCreatedFlagStorageManager(), []);
  const wizardDraftStorage = useMemo(() => new WizardDraftStorageManager(), []);
  const sessionStorage = useMemo(() => new SessionStorageManager(), []);

  const hasSession = Boolean(originalSession && currentSession);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Data</h1>
          <p className="mt-2 text-slate-600">Import/export and reset operations live here (not on the dashboard).</p>
        </div>
        <SecondaryButton onClick={() => router.push("/dashboard")}>Back to dashboard</SecondaryButton>
      </div>

      <div className="mt-4 space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Export</h2>
          <p className="mt-1 text-xs text-slate-600">Download an Excel export or a JSON snapshot of your session.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <SessionExcelExportButton />
          </div>
          <div className="mt-3">
            <SessionJsonControls />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Resets</h2>
          <p className="mt-1 text-xs text-slate-600">Use with care. These actions change your current session state.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <SecondaryButton onClick={() => coordinator.resetToOriginal()} disabled={!hasSession}>
              Reset to entered values
            </SecondaryButton>
            <PrimaryButton
              onClick={() => {
                const ok = window.confirm("Start from scratch? This clears your saved session and wizard draft.");
                if (!ok) return;
                coordinator.startNew();
                sessionStorage.clear();
                dashboardFlag.clear();
                wizardDraftStorage.clear();
                router.push("/");
              }}
            >
              Start from scratch
            </PrimaryButton>
          </div>
        </div>
      </div>
    </main>
  );
}

