import { useMemo } from "react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { AllocationSlider } from "@/components/slider/AllocationSlider";
import { NominalRealLineChart } from "@/components/charts/NominalRealLineChart";
import { EarningsBarChart } from "@/components/charts/EarningsBarChart";
import { GoalFundsBalanceChart } from "@/components/charts/GoalFundsBalanceChart";
import { DebtBalanceChart } from "@/components/charts/DebtBalanceChart";
import { useBudgetSessionCoordinator, useBudgetSessionState } from "@/domain/coordinators/BudgetSessionCoordinatorProvider";
import { BudgetDashboardViewModel } from "@/domain/viewmodels/BudgetDashboardViewModel";
import { AllocationDeltaApplier } from "@/domain/managers/allocation/AllocationDeltaApplier";
import { SessionAllocationUpdater } from "@/domain/managers/allocation/SessionAllocationUpdater";
import { SessionJsonControls } from "@/components/dashboard/SessionJsonControls";
import { SessionExcelExportButton } from "@/components/dashboard/SessionExcelExportButton";

export function DashboardPage() {
  const coordinator = useBudgetSessionCoordinator();
  const { currentSession } = useBudgetSessionState();

  const vm = useMemo(() => new BudgetDashboardViewModel(), []);
  const applier = useMemo(() => new AllocationDeltaApplier(), []);
  const updater = useMemo(() => new SessionAllocationUpdater(), []);

  const viewData = useMemo(() => {
    if (!currentSession) return null;
    return vm.build(currentSession);
  }, [currentSession, vm]);

  if (!currentSession || !viewData) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-slate-600">No session loaded. Start from the wizard.</p>
        <div className="mt-4">
          <PrimaryButton onClick={() => (window.location.href = "/")}>Go to wizard</PrimaryButton>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-slate-600">
            Net income (estimated):{" "}
            <span className="font-semibold text-slate-900">
              {viewData.netIncomeMonthly.formatCad()}/mo
            </span>
          </p>
          {viewData.memberNetIncomeMonthly.length > 1 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {viewData.memberNetIncomeMonthly.map((m) => (
                <div
                  key={m.memberId}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"
                >
                  <span className="font-semibold text-slate-900">{m.displayName}</span>{" "}
                  <span className="text-slate-600">{m.netIncomeMonthly.formatCad()}/mo</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <SessionExcelExportButton />
            <SessionJsonControls />
          </div>
          <SecondaryButton onClick={() => coordinator.resetToOriginal()}>
            Reset to entered values
          </SecondaryButton>
          <PrimaryButton
            onClick={() => {
              coordinator.startNew();
              window.location.href = "/";
            }}
          >
            Start from scratch
          </PrimaryButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Allocation slider</h2>
          <p className="mt-2 text-sm text-slate-600">
            Drag handles to rebalance between adjacent segments (snap: $10).
          </p>
          {viewData.isOverAllocated ? (
            <p className="mt-2 text-sm font-semibold text-red-700">
              You’ve allocated more than your estimated net income. Increase income or reduce
              categories.
            </p>
          ) : null}
          <div className="mt-4">
            <AllocationSlider
              totalCents={viewData.sliderTotalCents}
              segments={viewData.segments}
              onChange={(change) => {
                const updates = applier.computeUpdates(viewData.segments, change);
                if (updates.length === 0) return;
                const next = updater.applySegmentUpdates(currentSession, updates);
                coordinator.setCurrent(next);
              }}
            />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Charts</h2>
          <p className="mt-2 text-sm text-slate-600">
            Investment growth is currently based on your investment buckets (not expenses).
          </p>
          <div className="mt-4">
            <NominalRealLineChart
              series={viewData.nominalVsRealSeries}
              horizonYears={currentSession.projectionHorizonYears}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Goal funds (balances)</h2>
          <p className="mt-2 text-sm text-slate-600">
            Each goal fund contributes until its target is reached (then it stops).
          </p>
          <div className="mt-4">
            {viewData.goalFundBalanceSeries.length === 0 ? (
              <p className="text-sm text-slate-600">No goal funds.</p>
            ) : (
              <GoalFundsBalanceChart series={viewData.goalFundBalanceSeries} />
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Debts (balances)</h2>
          <p className="mt-2 text-sm text-slate-600">
            Debt is shown in red, trending toward zero (negative values).
          </p>
          <div className="mt-4">
            {viewData.debtBalanceSeries.length === 0 ? (
              <p className="text-sm text-slate-600">No debts.</p>
            ) : (
              <DebtBalanceChart series={viewData.debtBalanceSeries} />
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Earnings decomposition (end of horizon)</h2>
        <p className="mt-2 text-sm text-slate-600">
          Compare principal vs a simple-interest baseline vs compound total.
        </p>
        <div className="mt-4">
          <EarningsBarChart data={viewData.earningsDecomposition} />
        </div>
      </div>
    </main>
  );
}

