import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { AllocationSlider } from "@/components/slider/AllocationSlider";
import { NominalRealLineChart } from "@/components/charts/NominalRealLineChart";
import { EarningsBarChart } from "@/components/charts/EarningsBarChart";
import { GoalFundsBalanceChart } from "@/components/charts/GoalFundsBalanceChart";
import { DebtBalanceChart } from "@/components/charts/DebtBalanceChart";
import { DebtPayoffImpactPanel } from "@/components/dashboard/DebtPayoffImpactPanel";
import { GoalRedirectImpactPanel } from "@/components/dashboard/GoalRedirectImpactPanel";
import { RedirectsAppliedPanel } from "@/components/dashboard/RedirectsAppliedPanel";
import { useBudgetSessionCoordinator, useBudgetSessionState } from "@/domain/coordinators/BudgetSessionCoordinatorProvider";
import { BudgetDashboardViewModel } from "@/domain/viewmodels/BudgetDashboardViewModel";
import { AllocationDeltaApplier } from "@/domain/managers/allocation/AllocationDeltaApplier";
import { SessionAllocationUpdater } from "@/domain/managers/allocation/SessionAllocationUpdater";
import { Money } from "@/domain/models/Money";
import { DateMonthMath } from "@/domain/managers/debts/DateMonthMath";

export function DashboardPage() {
  const coordinator = useBudgetSessionCoordinator();
  const { currentSession } = useBudgetSessionState();
  const router = useRouter();

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
          <p className="mt-1 text-xs text-slate-600">
            Assumptions: tax year <span className="font-semibold text-slate-900">{viewData.assumptions.taxYear}</span> ·
            inflation{" "}
            <span className="font-semibold text-slate-900">{viewData.assumptions.assumedInflationPercent}%</span> · horizon{" "}
            <span className="font-semibold text-slate-900">{viewData.assumptions.projectionHorizonYears}y</span>{" "}
            <button
              type="button"
              className="ml-2 font-semibold text-slate-700 underline underline-offset-2 hover:text-slate-900"
              onClick={() => router.push("/assumptions")}
            >
              Edit
            </button>
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
          <SecondaryButton onClick={() => router.push("/data")}>Data</SecondaryButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Allocation slider</h2>
          <p className="mt-2 text-sm text-slate-600">
            Drag handles to rebalance between adjacent segments (snap: $10).
          </p>
          <button
            type="button"
            onClick={() => router.push("/expenses")}
            className="mt-2 inline-block text-left text-xs font-semibold text-slate-700 underline underline-offset-2 hover:text-slate-900"
          >
            Manage household categories
          </button>
          {viewData.isOverAllocated ? (
            <p className="mt-2 text-sm font-semibold text-red-700">
              Shortfall:{" "}
              <span className="font-bold">{Money.fromCents(viewData.shortfallCents).formatCad()}/mo</span>. Reduce
              allocations to get back to $0.
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
          {viewData.upcomingDebts.length > 0 ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">Upcoming debts</p>
              <p className="mt-1 text-xs text-slate-600">
                These debts start later and contribute <span className="font-semibold text-slate-900">$0</span> this month.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {viewData.upcomingDebts.map((d) => (
                  <div
                    key={d.debtId}
                    className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"
                  >
                    <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                    <span className="font-semibold text-slate-900">{d.name}</span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700">
                      Starts {DateMonthMath.monthKey(d.startDateIso)}
                    </span>
                    <span className="text-slate-600">
                      $0 this month • Planned{" "}
                      <span className="font-semibold text-slate-900">
                        {Money.fromCents(d.plannedPaymentCents).formatCad()}/mo
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
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
          {viewData.goalFundBalanceSeries.some((g) => (g.startOffsetMonths ?? 0) > 0) ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">Upcoming goals</p>
              <p className="mt-1 text-xs text-slate-600">
                These goals start in a future month and contribute <span className="font-semibold text-slate-900">$0</span>{" "}
                until they start.
              </p>
              <div className="mt-2 space-y-1">
                {viewData.goalFundBalanceSeries
                  .filter((g) => (g.startOffsetMonths ?? 0) > 0 && g.startDateIso)
                  .map((g) => (
                    <div key={g.fundId} className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900">{g.name}</span>
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-700">
                        Starts {DateMonthMath.monthKey(g.startDateIso!)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ) : null}
          {viewData.goalRedirectImpacts.some((g) => g.redirectTrace.length > 0) ? (
            <GoalRedirectImpactPanel impacts={viewData.goalRedirectImpacts} />
          ) : null}
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
          {viewData.debtPayoffImpacts.length > 0 ? (
            <DebtPayoffImpactPanel impacts={viewData.debtPayoffImpacts} />
          ) : null}
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

      <RedirectsAppliedPanel entries={viewData.redirectsAppliedTrace} />
    </main>
  );
}

