# DEBT-3 — Redirect rules to debts don’t affect debt payoff projections

## Customer / job-to-be-done

- **Customer**: Debt payoff user redirecting freed cashflow to accelerate payoff.
- **JTBD**: “When I redirect freed payments to a debt, payoff timelines must update and be explainable.”

## Problem statement

Redirect rules that route freed monthly amounts to a **Debt** do not consistently affect debt payoff projections. Users can configure redirects expecting earlier payoff, but the debt balance timeline does not reflect the redirected payments.

## Repro steps (journey)

1. Wizard → Debts: Create **Debt B**:
   - Balance: `$10,000`
   - APR: `8%`
   - Monthly payment: `$300`
2. Wizard → Goals (or Debts): Create a source that frees cashflow earlier (e.g., a goal that completes in ~12 months).
3. Configure redirect rule: **source completion → redirect freed monthly amount to Debt B**.
4. Create dashboard.
5. Compare Debt B payoff timeline with and without redirect.

## Expected vs Actual

- **Expected**
  - Redirect increases Debt B payments after the source completes.
  - Debt B payoff date moves earlier and the change is traceable to the redirect.
- **Actual**
  - Debt B amortization projection appears unchanged (redirect not applied) or is inconsistent across surfaces.

## Scope

- **In scope**
  - Ensure redirect rule payments apply as extra principal payments (per FIN definition) and affect payoff.
  - Ensure projections and any cashflow summaries agree.
- **Out of scope**
  - New payoff strategies UI unless already present.
  - Multi-destination split rules unless already present.

## Acceptance criteria (testable)

- With redirect enabled, Debt B payoff month index decreases relative to baseline.
- Redirect application conserves dollars (no creation/loss) and is consistent with cashflow.
- Projections provide a minimal trace of redirect application (month, amount, source).

## Requirements Ledger

- **UXR-DEBT-3 — Redirect impact is visible + explainable on Dashboard (read-only)**
  - **Status**: Complete
  - **Evidence**
    - **Screens**: Dashboard → Debts section (“Redirect impact” + expandable trace)
    - **Files**: `src/components/dashboard/DashboardPage.tsx`, `src/components/dashboard/DebtPayoffImpactPanel.tsx`, `src/domain/viewmodels/BudgetDashboardViewModel.ts`
    - **Tests**: `e2e/debt-3-redirect-to-debt-affects-payoff.spec.ts`
  - **Notes**: Dashboard remains read-only for redirect configuration; trace lists Month / Amount / Source.

- **FIN-DEBT-3 — Redirect-to-debt payment semantics are correct and conservative**
  - **Status**: Complete
  - **Evidence**
    - **Files**: `src/domain/managers/cashflow/CashflowTimelineManager.ts`, `src/domain/managers/debts/DebtPaymentDrivenScheduleBuilder.ts`
    - **Tests**: `src/domain/managers/debts/DebtPaymentDrivenScheduleBuilder.test.ts`
  - **Notes**
    - Redirect-to-debt is an extra payment in the same month.
    - Monthly order: interest first, then payments (scheduled first, then redirect payment).
    - Cap at (balance + interest); remainder becomes unallocated cash that month.
    - Negative amortization allowed when payment < interest.
    - Future-start debts cannot be pre-paid by redirects.

- **TECH-DEBT-3 — Single source of truth: debt projections derived from cashflow payment stream**
  - **Status**: Complete
  - **Evidence**
    - **Files**: `src/domain/managers/cashflow/CashflowTimelineManager.ts`, `src/domain/viewmodels/BudgetDashboardViewModel.ts`, `src/domain/managers/debts/DebtPaymentDrivenScheduleBuilder.ts`
    - **Tests**: `src/domain/viewmodels/BudgetDashboardViewModel.test.ts`
  - **Notes**: Dashboard debt balance series uses payment stream that already includes redirect/cap behavior.

## Implementation summary

- `CashflowTimelineManager` simulates debt balances month-by-month and applies redirected cents as same-month extra payments (with capping + pre-start guard).
- `BudgetDashboardViewModel` derives debt balance series from the cashflow timeline’s debt payment streams and computes payoff “was” (baseline without redirects) vs “now”.
- Dashboard Debts UI renders a minimal “Redirect impact” panel with payoff delta + expandable trace.

## Evidence / verification

- **Unit**
  - `src/domain/managers/debts/DebtPaymentDrivenScheduleBuilder.test.ts`
  - `src/components/wizard/WizardDebtPaymentCalculator.test.ts`
- **ViewModel**
  - `src/domain/viewmodels/BudgetDashboardViewModel.test.ts` (redirect to debt reduces payoff month index vs baseline)
- **E2E (Playwright)**
  - `e2e/debt-3-redirect-to-debt-affects-payoff.spec.ts`
- **Commands**
  - `npm test`
  - `npx playwright test`

## Design QA

- **Mode**: Browser end-to-end (Playwright)
- **Status**: PASS
- **Command**: `npx playwright test e2e/debt-3-redirect-to-debt-affects-payoff.spec.ts`

## Owner routing

- **Primary**: Fin + TechLead + Dev
- **Consult**: Design (traceability UX)

## Test plan

- Unit: redirected payments reduce principal per defined order.
- Integration: wizard with redirect → dashboard debt chart updates.
- Regression: baseline debt schedule unchanged when redirect disabled.

## Design QA mode required?

- **Browser end-to-end required**: **Yes**

