# PROJ-3 — Over-allocation hides deficit magnitude (warning only)

## Customer / job-to-be-done

- **Customer**: Budgeting user adjusting allocation sliders.
- **JTBD**: “If I’m over budget, tell me exactly how much so I can fix it quickly.”

## Problem statement

When allocations exceed estimated net income, the UI shows a warning but does not surface a first-class **shortfall amount**. “Unallocated” is clamped to 0, hiding how far over budget the user is.

## Repro steps (journey)

1. Create dashboard session with a known net income estimate (e.g., ~$6,000/mo).
2. Increase allocations above net income.
3. Observe warning message and the “Unallocated” display.

## Expected vs Actual

- **Expected**
  - UI displays “Shortfall: $X/mo” when over-allocated.
  - User can see exactly how much needs to be reduced.
- **Actual**
  - Warning only; shortfall amount not shown.

## Scope

- **In scope**
  - Add explicit shortfall display in allocation model UI.
  - Ensure it’s consistent between wizard and dashboard (if both show allocation warnings).
- **Out of scope**
  - Automatic rebalancing or recommendations.

## Acceptance criteria (testable)

- If allocations > net:
  - UI shows Shortfall = allocations − net (formatted currency).
  - Shortfall updates live as allocations change.
- If allocations ≤ net:
  - Shortfall is not shown and Unallocated shows the positive remainder.

## Requirements Ledger placeholders

- **UXR-1**
  - When over-allocated, the dashboard shows an explicit **Shortfall: $X/mo**.
- **FIN**
  - N/A
- **TECH-1**
  - View model exposes `shortfallCents = max(0, allocated - net)` so UI can render it.
  - Evidence: `BudgetDashboardViewModel.shortfallCents` and dashboard warning copy.

## Owner routing

- **Primary**: Design + Dev

## Test plan

- Browser: over-allocate and verify shortfall display matches arithmetic.
- Unit: view model computes shortfall accurately.

### Evidence

- **Unit**: `src/domain/viewmodels/BudgetDashboardViewModel.test.ts` (“shortfall”)
- **E2E**: `e2e/proj-3-shortfall-visible.spec.ts`

## Design QA mode required?

- **Browser end-to-end required**: **Yes**

