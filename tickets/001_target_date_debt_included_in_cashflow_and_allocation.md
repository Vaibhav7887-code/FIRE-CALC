# DEBT-1 — Target-payoff-date debts amortize but don’t affect cashflow/outflow/allocation

## Customer / job-to-be-done

- **Customer**: Person paying down debt while planning toward FIRE.
- **JTBD**: “Let me choose a payoff plan and trust that payments show up everywhere (cashflow, allocation, projections) consistently.”

## Problem statement

Debts configured with a **Target payoff date** can still amortize to $0 in projections, but their implied payments are **not included** in planned outflow and allocation surfaces. This creates a contradiction (“debt pays off for free”) and breaks trust.

## Repro steps (journey)

1. Wizard → Debts.
2. Add a debt:
   - Balance: `$20,000`
   - Interest (APR): `6%`
   - Payoff plan: **Target payoff date** = `2027-12-01`
3. Observe wizard **Cashflow summary** planned outflow.
4. Create dashboard.
5. Observe:
   - Allocation model/segments
   - Debt balance chart (amortizing to $0)

## Expected vs Actual

- **Expected**
  - The app shows the **implied periodic payment** for target-date debts.
  - Planned outflow and allocation totals include that implied payment (or clearly model it as a non-allocatable fixed obligation, consistently).
  - Debt payoff chart remains consistent with cashflow.
- **Actual**
  - Debt amortization schedule computes/payoffs.
  - Planned outflow/allocation omit target-date debt payments (creating a mismatch).

## Scope

- **In scope**
  - Ensure target-date debt payments are represented consistently in:
    - Wizard cashflow summary
    - Dashboard allocation model
    - Any other “planned outflow” summary
  - Define and enforce a single modeling rule for implied payments.
- **Out of scope**
  - New payoff strategies (snowball/avalanche UI) unless already present.
  - New scenario system.

## Acceptance criteria (testable)

- Creating a target-date debt surfaces an **implied monthly payment** value (display + data).
- Wizard planned outflow includes the implied payment.
- Dashboard allocation totals include the implied payment (or the UI explicitly labels it as “fixed obligation” and includes it in net-available math).
- Debt payoff chart is consistent with the payment representation (no “free payoff”).

## Requirements Ledger

- **UXR-DEBT-1 — Target-date debt payments are visible and consistent**
  - **Status**: Complete
  - **Evidence**
    - **Screens**: Wizard → Debts (implied payment hint), Wizard cashflow summary, Dashboard → Allocation slider
    - **Files**: `src/components/wizard/steps/StepDebts.tsx`, `src/components/wizard/WizardCashflowSummaryCard.tsx`, `src/domain/viewmodels/BudgetDashboardViewModel.ts`, `src/components/slider/AllocationSlider.tsx`
    - **Tests**: `e2e/debt-1-target-date-debt.spec.ts`, `src/domain/viewmodels/BudgetDashboardViewModel.test.ts`, `src/components/wizard/WizardDebtPaymentCalculator.test.ts`
  - **Notes**: Allocation slider boundaries adjacent to target-date debt segments are fixed/locked.

- **FIN-DEBT-1 — Implied payment math is deterministic and reconciles with cashflow**
  - **Status**: Complete
  - **Evidence**
    - **Files**: `src/domain/managers/debts/DebtAmortizationManager.ts`
    - **Tests**: `src/domain/managers/debts/DebtAmortizationManager.test.ts`
  - **Notes**
    - Monthly rate basis: nominal \(r = APR/12\)
    - Month count: derived from `monthsBetweenIso(startIso, targetIso)` with \(N \ge 1\)
    - Cents rounding: payments/balances represented as integer cents; final payment can be smaller to land at \$0

- **TECH-DEBT-1 — Single source-of-truth for monthly debt payment stream**
  - **Status**: Complete
  - **Evidence**
    - **Files**: `src/domain/managers/cashflow/CashflowTimelineManager.ts`, `src/domain/managers/debts/DebtAmortizationManager.ts`, `src/components/wizard/WizardDebtPaymentCalculator.ts`, `src/domain/viewmodels/BudgetDashboardViewModel.ts`
    - **Tests**: `npm test` (vitest), `npx playwright test` (Playwright E2E)
  - **Notes**: Wizard and dashboard derive target-date debt monthly payment via `DebtAmortizationManager.computeMonthlyPaymentFromDebt`.

## Design QA

- **Mode**: Browser end-to-end (via Playwright)
- **Status**: PASS
- **Evidence**
  - Command: `npx playwright test`
  - Test: `e2e/debt-1-target-date-debt.spec.ts` (asserts wizard planned outflow increases and dashboard allocation shows non-zero debt segment + fixed boundary)

## Owner routing

- **Primary**: Fin + TechLead + Dev
- **Consult**: Design (copy/labels only)

## Test plan

- Unit: debt implied payment equals amortization schedule payment for target payoff date.
- Integration: wizard → dashboard shows same planned outflow numbers and debt payoff timeline.
- Regression: monthly-payment debts unchanged.

## Design QA mode required?

- **Browser end-to-end required**: **Yes** (wizard + dashboard consistency)

