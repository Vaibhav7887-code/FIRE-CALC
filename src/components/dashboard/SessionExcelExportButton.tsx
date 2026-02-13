"use client";

import { useMemo, useState } from "react";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { ExcelExportManager } from "@/domain/managers/export/ExcelExportManager";
import { useBudgetSessionState } from "@/domain/coordinators/BudgetSessionCoordinatorProvider";
import { BudgetDashboardViewModel } from "@/domain/viewmodels/BudgetDashboardViewModel";

export function SessionExcelExportButton() {
  const { currentSession } = useBudgetSessionState();
  const [error, setError] = useState<string | null>(null);
  const vm = useMemo(() => new BudgetDashboardViewModel(), []);
  const exporter = useMemo(() => new ExcelExportManager(), []);

  const download = async () => {
    setError(null);
    if (!currentSession) return;
    try {
      const viewData = vm.build(currentSession);
      await exporter.downloadWorkbook(currentSession, viewData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Excel export failed.");
    }
  };

  return (
    <div className="space-y-1">
      <SecondaryButton onClick={() => void download()} disabled={!currentSession}>
        Download Excel
      </SecondaryButton>
      {error ? <p className="text-xs font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}

