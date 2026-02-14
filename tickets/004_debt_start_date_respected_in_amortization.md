# DEBT-2 — Debt start date ignored in debt balance projections

## Customer / job-to-be-done

- **Customer**: Debt payoff user coordinating future-start loans (e.g., mortgage begins later).
- **JTBD**: “If a debt starts later, payoff timelines must not begin early.”

## Problem statement

Debt amortization/projection outputs do not honor the debt’s **Start date**. Debts scheduled to start in the future begin amortizing immediately in projections, producing incorrect balances and payoff dates.

## Repro steps (journey)

1. Wizard → Debts.
2. Add a debt:
   - Name: “Mortgage”
   - Balance: `$500,000`
   - Interest (APR): `4.5%`
   - Start date: `2026-10-01`
   - Monthly payment: `$2,500`
3. Create dashboard.
4. View debt balance projection.

## Expected vs Actual

- **Expected**
  - Balance stays flat until the configured start month (per defined semantics).
  - Payments and interest begin per start-date rule.
- **Actual**
  - Projection begins at month 0 regardless of start date.

## Scope

- **In scope**
  - Apply start-date offset to debt amortization/projections across surfaces.
  - Disclose/define interest accrual semantics before start (if any).
- **Out of scope**
  - Variable interest rates.
  - Detailed intramonth timing unless explicitly supported.

## Acceptance criteria (testable)

- For a future-start debt, schedule reflects no payments prior to start month.
- Any interest accrual before start is explicitly defined and consistently applied (or explicitly not applied).
- All debt projection surfaces agree on the same behavior.

## Requirements Ledger placeholders

### Requirements Ledger

- **UXR-1**: **Complete** — Future-start debts do not affect current-month totals and are shown as Upcoming with start-month copy  
  - **Evidence (screens)**:
    - Wizard → Debts: future-start badge “Starts {Mon YYYY}”
    - Wizard cashflow summary: Upcoming debts callout with “Starts YYYY-MM” + planned payment + “$0 this month” behavior
    - Dashboard allocation: Upcoming debts section with “Starts YYYY-MM” + planned payment + “$0 this month”
  - **Evidence (files)**:
    - `src/components/wizard/steps/StepDebts.tsx`
    - `src/components/wizard/WizardCashflowSummaryCard.tsx`
    - `src/components/dashboard/DashboardPage.tsx`
  - **Evidence (tests)**:
    - `e2e/debt-2-start-date-upcoming.spec.ts`

- **FIN-1**: **Complete** — Debt originates at start (pre-start months: balance=0, interest=0, payment=0; start month inclusive)  
  - **Evidence (files)**:
    - `src/domain/managers/debts/DebtAmortizationManager.ts`
    - `src/domain/managers/cashflow/CashflowTimelineManager.ts`
  - **Evidence (tests)**:
    - `src/domain/managers/debts/DebtAmortizationManager.test.ts`

- **TECH-1**: **Complete** — Upcoming debts are modeled explicitly and excluded from current-month allocation totals  
  - **Evidence (files)**:
    - `src/domain/viewmodels/BudgetDashboardViewData.ts`
    - `src/domain/viewmodels/BudgetDashboardViewModel.ts`
  - **Evidence (tests)**:
    - `src/domain/viewmodels/BudgetDashboardViewModel.test.ts`

## Owner routing

- **Primary**: Fin + Dev
- **Consult**: Design (copy/labels)

## Test plan

- Unit: amortization schedule is flat prior to start offset.
- Integration: wizard → dashboard debt chart remains flat until start month.

## Design QA mode required?

- **Browser end-to-end required**: **Yes**

## Design QA

- **Status**: PASS
- **Command**: `npx playwright test e2e/debt-2-start-date-upcoming.spec.ts`

