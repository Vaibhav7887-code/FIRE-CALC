import { Money } from "@/domain/models/Money";
import { DebtPayoffImpact } from "@/domain/viewmodels/BudgetDashboardViewData";

export function DebtPayoffImpactPanel(props: Readonly<{ impacts: ReadonlyArray<DebtPayoffImpact> }>) {
  const impacts = props.impacts ?? [];
  if (impacts.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4" data-testid="debt-payoff-impact-panel">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">Redirect impact</p>
          <p className="mt-1 text-xs text-slate-600">
            Baseline payoff (“was”) vs with redirects (“now”), plus a minimal redirect trace.
          </p>
        </div>
        <a
          href="/"
          className="text-xs font-semibold text-slate-700 underline underline-offset-2 hover:text-slate-900"
        >
          Manage redirect rules
        </a>
      </div>

      <div className="mt-3 space-y-3">
        {impacts.map((d) => (
          <div
            key={d.debtId}
            className="rounded-lg border border-slate-200 bg-white p-3"
            data-testid={`debt-payoff-impact-${d.debtId}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">{d.name}</p>
                <p className="mt-1 text-xs text-slate-700" data-testid="debt-payoff-impact-text">
                  Payoff: <span className="text-slate-600">was</span>{" "}
                  <span className="font-semibold text-slate-900">{d.payoffWasLabel}</span>{" "}
                  <span className="text-slate-600">→ now</span>{" "}
                  <span className="font-semibold text-slate-900">{d.payoffNowLabel}</span>
                </p>
              </div>
            </div>

            <details className="mt-3" data-testid="debt-redirect-trace">
              <summary className="cursor-pointer select-none text-xs font-semibold text-slate-700">
                Redirect trace ({d.redirectTrace.length})
              </summary>

              {d.redirectTrace.length === 0 ? (
                <p className="mt-2 text-xs text-slate-600">No redirects applied to this debt.</p>
              ) : (
                <div className="mt-2 overflow-hidden rounded-md border border-slate-200">
                  <div className="grid grid-cols-12 gap-2 bg-slate-100 px-3 py-2 text-[11px] font-semibold text-slate-700">
                    <div className="col-span-4">Month</div>
                    <div className="col-span-3 text-right">Amount</div>
                    <div className="col-span-5">Source</div>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {d.redirectTrace.map((t, idx) => (
                      <div
                        key={`${t.monthIndex}-${idx}-${t.sourceLabel}`}
                        className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-slate-800"
                        data-testid="debt-redirect-trace-item"
                      >
                        <div className="col-span-4">{t.monthLabel}</div>
                        <div className="col-span-3 text-right font-semibold text-slate-900">
                          {Money.fromCents(t.amountCents).formatCad()}
                        </div>
                        <div className="col-span-5 text-slate-700">{t.sourceLabel}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}

