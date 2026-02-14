"use client";

import { Money } from "@/domain/models/Money";
import { RedirectsAppliedTraceEntry } from "@/domain/viewmodels/BudgetDashboardViewData";

type Props = Readonly<{
  entries: ReadonlyArray<RedirectsAppliedTraceEntry>;
}>;

export function RedirectsAppliedPanel(props: Props) {
  const entries = props.entries ?? [];
  if (entries.length === 0) return null;

  const trimmed = entries.slice(-50);

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm" data-testid="redirects-applied-panel">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Redirects applied</h2>
          <p className="mt-1 text-sm text-slate-600">
            Read-only trace of redirect/ceiling rules the engine applied while building projections.
          </p>
        </div>
        <a href="/" className="text-xs font-semibold text-slate-700 underline underline-offset-2 hover:text-slate-900">
          Manage redirect rules
        </a>
      </div>

      <details className="mt-3" open data-testid="redirects-applied-details">
        <summary className="cursor-pointer select-none text-xs font-semibold text-slate-700">
          Trace entries ({trimmed.length})
        </summary>
        <div className="mt-3 overflow-hidden rounded-md border border-slate-200">
          <div className="grid grid-cols-12 gap-2 bg-slate-100 px-3 py-2 text-[11px] font-semibold text-slate-700">
            <div className="col-span-2">Month</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-4">Source</div>
            <div className="col-span-4">Destination</div>
          </div>
          <div className="divide-y divide-slate-200">
            {trimmed.map((t, idx) => (
              <div
                key={`${t.monthIndex}-${idx}-${t.sourceLabel}-${t.destinationLabel}`}
                className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-slate-800"
                data-testid="redirects-applied-item"
              >
                <div className="col-span-2">{t.monthLabel}</div>
                <div className="col-span-2 text-right font-semibold text-slate-900">
                  {Money.fromCents(t.amountCents).formatCad()}
                </div>
                <div className="col-span-4 text-slate-700">{t.sourceLabel}</div>
                <div className="col-span-4 text-slate-700">{t.destinationLabel}</div>
              </div>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}

