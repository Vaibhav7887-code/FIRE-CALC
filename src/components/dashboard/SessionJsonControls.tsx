"use client";

import { useRef, useState } from "react";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useBudgetSessionCoordinator, useBudgetSessionState } from "@/domain/coordinators/BudgetSessionCoordinatorProvider";
import { SessionSerializer } from "@/domain/adapters/SessionSerializer";

export function SessionJsonControls() {
  const coordinator = useBudgetSessionCoordinator();
  const { originalSession, currentSession } = useBudgetSessionState();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportJson = async () => {
    setError(null);
    if (!originalSession || !currentSession) return;
    const serializer = new SessionSerializer();
    const snapshot = serializer.toSnapshot(originalSession, currentSession);
    const json = serializer.snapshotToJson(snapshot);

    try {
      await navigator.clipboard.writeText(json);
    } catch {
      // Clipboard can fail depending on context; fall back to download.
    }

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "budgeting-session.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportFile = async (file: File) => {
    setError(null);
    try {
      const text = await file.text();
      const serializer = new SessionSerializer();
      const snapshot = serializer.snapshotFromJson(text);
      const restored = serializer.fromSnapshot(snapshot);
      coordinator.setOriginalAndCurrentExplicit(restored.original, restored.current);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON snapshot.");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <SecondaryButton onClick={exportJson} disabled={!originalSession || !currentSession}>
          Export JSON
        </SecondaryButton>
        <PrimaryButton onClick={() => fileInputRef.current?.click()}>Import JSON</PrimaryButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            void onImportFile(file);
            e.target.value = "";
          }}
        />
      </div>
      {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
      <p className="text-xs text-slate-600">
        Export includes both your original baseline and your current adjusted allocations.
      </p>
    </div>
  );
}

