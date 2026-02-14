# GOAL-1 — Goal start date ignored in goal projections

## Customer / job-to-be-done

- **Customer**: FIRE planner modeling goal savings over time.
- **JTBD**: “If I set a future start month, projections must not start contributions early.”

## Problem statement

Goal projections (chart/series) do not honor the goal’s **Start date**. Goals scheduled to begin later appear to start immediately, producing incorrect timelines and breaking trust.

## Repro steps (journey)

1. Wizard → Goals.
2. Add Goal “Emergency fund”:
   - Start date = `2026-06-01`
   - Current balance = `$0`
   - Target = `$10,000`
   - Monthly contribution = `$500`
3. Create dashboard.
4. View Goal funds balances projection.

## Expected vs Actual

- **Expected**
  - Goal balance remains flat (no contributions) until the configured start month.
  - After start month, contributions apply per frequency.
- **Actual**
  - Projection begins at month 0 regardless of start date.

## Scope

- **In scope**
  - Apply start-date offset to goal projections consistently across all projection surfaces.
  - Ensure start-date semantics are consistent with cashflow timeline.
- **Out of scope**
  - New frequency types (weekly/biweekly) unless already supported.
  - Scenario overrides.

## Acceptance criteria (testable)

- If goal start date is N months in future, projected contributions are $0 for months 0..N-1.
- All goal projection surfaces (charts/summary) reflect the same start-date behavior.
- Copy/tooltip clarifies start-date granularity (month-based).

## Requirements Ledger

- **UXR-GOAL-1 — Start month behavior is clear in the dashboard**
  - **Status**: Complete
  - **Evidence**
    - **Screens**: Dashboard → Goal funds (balances) shows “Upcoming goals” with “Starts YYYY-MM” and “$0 until they start”
    - **Files**: `src/components/dashboard/DashboardPage.tsx`
    - **Tests**: `e2e/goal-1-start-date-upcoming.spec.ts`

- **FIN-GOAL-1 — Pre-start semantics are flat (no growth, no contributions)**
  - **Status**: Complete
  - **Evidence**
    - **Files**: `src/domain/managers/goals/GoalFundProjectionManager.ts`
    - **Tests**: `src/domain/managers/goals/GoalFundProjectionManager.test.ts`
  - **Notes**: Month-granular start date; pre-start months have no growth or contributions.

- **TECH-GOAL-1 — Goal projections honor start date deterministically**
  - **Status**: Complete
  - **Evidence**
    - **Files**: `src/domain/managers/goals/GoalFundProjectionManager.ts`, `src/domain/viewmodels/BudgetDashboardViewModel.ts`
    - **Tests**: `npm test`, `npx playwright test e2e/goal-1-start-date-upcoming.spec.ts`
  - **Notes**: Dashboard passes `timelineStartIso` to the projection manager to avoid drift.

## Owner routing

- **Primary**: Fin + Dev
- **Consult**: Design (labeling)

## Test plan

- Unit: projection series has 0 contributions before start offset.
- E2E: wizard → dashboard goal chart stays flat until start month.

## Design QA mode required?

- **Browser end-to-end required**: **Yes**

## Design QA

- **Mode**: Browser end-to-end (Playwright)
- **Status**: PASS
- **Command**: `npx playwright test e2e/goal-1-start-date-upcoming.spec.ts`

