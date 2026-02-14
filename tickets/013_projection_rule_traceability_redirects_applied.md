# PROJ-2 — Redirect/ceiling rule effects not observable/traceable in projections

## Customer / job-to-be-done

- **Customer**: FIRE planner iterating on rules and expecting explainable projections.
- **JTBD**: “When numbers change, show me what changed and why, without hunting across tabs.”

## Problem statement

Redirect and ceiling rules may apply in the underlying model, but projections/dashboards do not provide a clear, user-visible trace of **which rules applied**, **when**, and **where money went**. This creates opacity and makes results feel untrustworthy.

## Repro steps (journey)

1. Configure at least one redirect rule:
   - Goal completion → redirect freed amount to an investment/goal/debt, and/or
   - Registered room ceiling → redirect freed amount to something else
2. Create dashboard.
3. Observe projections/charts and attempt to answer:
   - Which month did the redirect apply?
   - How much was redirected?
   - Where did it go?

## Expected vs Actual

- **Expected**
  - Projections show a read-only trace (or driver list) that attributes changes to redirect/ceiling rules.
  - Users can deep-link to the rule source configuration.
- **Actual**
  - No clear trace; users infer behavior indirectly (or see mismatches if projections ignore redirects).

## Scope

- **In scope**
  - Add read-only “Rules applied / Redirects applied” trace in projections/dashboard.
  - Provide deep links to the configuration home (wizard review for now; later a rules home).
- **Out of scope**
  - Full scenario diff system.

## Acceptance criteria (testable)

- When a redirect applies, projections surface shows:
  - Source (goal/debt/ceiling) + source name
  - Destination kind + destination name
  - Month index/date
  - Applied amount
- Trace entries reconcile with changes in charts/totals.

## Requirements Ledger placeholders

- **UXR-1**
  - Dashboard must show a read-only “Redirects applied” trace with month, amount, source, destination.
  - Trace must include a deep link to manage redirect rules (wizard for now).
- **FIN-1**
  - Redirect trace entries must reflect actual applied cents (post-cap, post-ceiling), not planned cents.
- **TECH-1**
  - Expose redirect application events (`CashflowTimelineResult.redirectsApplied`) in the dashboard view model with resolved labels.
  - Evidence: `BudgetDashboardViewModel.redirectsAppliedTrace`.
  - Evidence: `RedirectsAppliedPanel` renders the trace in the dashboard.

## Owner routing

- **Primary**: Design + Dev
- **Consult**: Fin (terminology/semantics)

## Test plan

- Browser: configure a redirect; verify a trace row appears with correct month and amount.
- Unit: view model includes redirect events and labels resolve correctly.

### Evidence

- **Unit**: `src/domain/viewmodels/BudgetDashboardViewModel.test.ts` (verifies global trace includes source/destination labels)
- **E2E**: `e2e/proj-2-redirects-applied-trace-panel.spec.ts`
- **UI**: `src/components/dashboard/RedirectsAppliedPanel.tsx` rendered from `src/components/dashboard/DashboardPage.tsx`

## Design QA mode required?

- **Browser end-to-end required**: **Yes**

