"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { HouseholdExpenseCategoriesEditor } from "@/components/expenses/HouseholdExpenseCategoriesEditor";
import { HouseholdExpensesViewModel } from "@/domain/viewmodels/HouseholdExpensesViewModel";
import { HouseholdExpenseCategoryDraft } from "@/domain/viewmodels/HouseholdExpensesViewData";
import { SessionHouseholdBudgetUpdater } from "@/domain/managers/household/SessionHouseholdBudgetUpdater";
import { IdentifierFactory } from "@/domain/models/Identifiers";
import { useBudgetSessionCoordinator, useBudgetSessionState } from "@/domain/coordinators/BudgetSessionCoordinatorProvider";

type Draft = Readonly<{
  allocatedMonthly: string;
  categories: ReadonlyArray<HouseholdExpenseCategoryDraft>;
}>;

export function ExpensesPage() {
  const coordinator = useBudgetSessionCoordinator();
  const { currentSession } = useBudgetSessionState();
  const router = useRouter();

  const vm = useMemo(() => new HouseholdExpensesViewModel(), []);
  const updater = useMemo(() => new SessionHouseholdBudgetUpdater(), []);

  const [draft, setDraft] = useState<Draft>({ allocatedMonthly: "0", categories: [] });
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!currentSession) return;
    const vd = vm.fromSession(currentSession);
    setDraft({ allocatedMonthly: vd.allocatedMonthly, categories: vd.categories });
  }, [currentSession, vm]);

  const remainderCents = useMemo(() => vm.computeRemainderCents(draft), [draft, vm]);

  if (!currentSession) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Household categories</h1>
        <p className="mt-2 text-slate-600">No session loaded. Start from the wizard.</p>
        <div className="mt-4">
          <PrimaryButton onClick={() => router.push("/")}>Go to wizard</PrimaryButton>
        </div>
      </main>
    );
  }

  const resetToCurrentSession = () => {
    const vd = vm.fromSession(currentSession);
    setDraft({ allocatedMonthly: vd.allocatedMonthly, categories: vd.categories });
    setSavedMessage(null);
  };

  const save = () => {
    const next = updater.applyDraft(currentSession, {
      allocatedMonthly: draft.allocatedMonthly,
      categories: draft.categories,
    } as any);
    coordinator.setCurrent(next);
    setSavedMessage("Saved.");
    window.setTimeout(() => setSavedMessage(null), 1500);
  };

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Household categories</h1>
          <p className="mt-2 text-slate-600">Edit the categories that make up your Household total.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SecondaryButton onClick={() => router.push("/dashboard")}>Back to dashboard</SecondaryButton>
          <SecondaryButton onClick={resetToCurrentSession}>Reset</SecondaryButton>
          <PrimaryButton onClick={save}>Save changes</PrimaryButton>
        </div>
      </div>

      {savedMessage ? <p className="mt-3 text-sm font-semibold text-emerald-700">{savedMessage}</p> : null}

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <HouseholdExpenseCategoriesEditor
          allocatedMonthly={draft.allocatedMonthly}
          categories={draft.categories}
          remainderCents={remainderCents}
          onChangeAllocatedMonthly={(next) => setDraft((d) => ({ ...d, allocatedMonthly: next }))}
          onChangeCategoryName={(categoryId, next) =>
            setDraft((d) => ({
              ...d,
              categories: d.categories.map((c) => (c.id === categoryId ? { ...c, name: next } : c)),
            }))
          }
          onChangeCategoryMonthlyAmount={(categoryId, next) =>
            setDraft((d) => ({
              ...d,
              categories: d.categories.map((c) => (c.id === categoryId ? { ...c, monthlyAmount: next } : c)),
            }))
          }
          onAddCategory={() =>
            setDraft((d) => ({
              ...d,
              categories: [{ id: IdentifierFactory.create(), name: "", monthlyAmount: "" }, ...d.categories],
            }))
          }
          onRemoveCategory={(categoryId) => {
            const cat = draft.categories.find((c) => c.id === categoryId);
            const ok = window.confirm(`Remove category${cat?.name ? ` “${cat.name}”` : ""}?`);
            if (!ok) return;
            setDraft((d) => ({ ...d, categories: d.categories.filter((c) => c.id !== categoryId) }));
          }}
          onMoveCategoryUp={(categoryId) =>
            setDraft((d) => ({
              ...d,
              categories: moveById(d.categories, categoryId, -1),
            }))
          }
          onMoveCategoryDown={(categoryId) =>
            setDraft((d) => ({
              ...d,
              categories: moveById(d.categories, categoryId, 1),
            }))
          }
        />
      </div>
    </main>
  );
}

function moveById<T extends { id: string }>(items: ReadonlyArray<T>, id: string, delta: -1 | 1): ReadonlyArray<T> {
  const idx = items.findIndex((x) => x.id === id);
  if (idx < 0) return items;
  const nextIdx = idx + delta;
  if (nextIdx < 0 || nextIdx >= items.length) return items;

  const copy = items.slice();
  const [moved] = copy.splice(idx, 1);
  copy.splice(nextIdx, 0, moved);
  return copy;
}

