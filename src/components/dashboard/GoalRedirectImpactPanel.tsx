"use client";

import { GoalRedirectImpact } from "@/domain/viewmodels/BudgetDashboardViewData";
import { Money } from "@/domain/models/Money";

type Props = Readonly<{
  impacts: ReadonlyArray<GoalRedirectImpact>;
}>;

export function GoalRedirectImpactPanel(props: Props) {
  if (props.impacts.length === 0) return null;

  return (
    <div
      className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
      data-testid="goal-redirect-impact-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Redirect impact</h3>
          <p className="mt-1 text-xs text-slate-600">
            Baseline target reached (“was”) vs with redirects (“now”), plus a minimal redirect trace.
          </p>
        </div>
        <a href="/" className="text-xs font-semibold text-slate-700 underline underline-offset-2 hover:text-slate-900">
          Manage redirect rules
        </a>
      </div>

      <div className="mt-3 space-y-3">
        {props.impacts.map((g) => {
          const hasTrace = g.redirectTrace.length > 0;
          return (
            <div
              key={g.fundId}
              className="rounded-lg border border-slate-200 bg-white p-3"
              data-testid={`goal-redirect-impact-${g.fundId}`}
              data-testid-item="goal-redirect-impact-item"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-900">{g.name}</span>
                <span className="text-xs text-slate-700">
                  Target reached:{" "}
                  <span className="font-semibold text-slate-900">{g.targetReachedWasLabel}</span>{" "}
                  <span className="text-slate-500">→</span>{" "}
                  <span className="font-semibold text-slate-900">{g.targetReachedNowLabel}</span>
                </span>
              </div>

              <details className="mt-2" data-testid="goal-redirect-trace">
                <summary className="cursor-pointer select-none text-xs font-semibold text-slate-700">
                  Redirect trace ({g.redirectTrace.length})
                </summary>
                <div className="mt-2">
                  {hasTrace ? (
                    <div className="overflow-hidden rounded-md border border-slate-200">
                      <div className="grid grid-cols-12 gap-2 bg-slate-100 px-3 py-2 text-[11px] font-semibold text-slate-700">
                        <div className="col-span-3">Month</div>
                        <div className="col-span-3 text-right">Amount</div>
                        <div className="col-span-6">Source</div>
                      </div>
                      <div className="divide-y divide-slate-200">
                        {g.redirectTrace.map((t, idx) => (
                          <div
                            key={`${g.fundId}:${t.monthIndex}:${idx}:${t.sourceLabel}`}
                            className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-slate-800"
                            data-testid="goal-redirect-trace-item"
                          >
                            <div className="col-span-3">{t.monthLabel}</div>
                            <div className="col-span-3 text-right font-semibold text-slate-900">
                              {Money.fromCents(t.amountCents).formatCad()}
                            </div>
                            <div className="col-span-6 text-slate-700">{t.sourceLabel}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600">No redirects applied to this goal.</p>
                  )}
                </div>
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
}

