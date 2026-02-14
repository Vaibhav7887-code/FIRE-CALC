# PROJ-1 — Recurring toggle inconsistently applied (allocation vs projection/tax)

## Customer / job-to-be-done

- **Customer**: FIRE planner setting recurring contributions and expecting consistent cashflow math.
- **JTBD**: “If I mark a contribution as non-recurring, it should not be treated as monthly dollars anywhere.”

## Problem statement

Investment buckets with **Recurring monthly contributions** turned off can still contribute dollars to the **allocation model**, while other parts of the system treat non-recurring as $0 for monthly cashflow and tax/projection logic. This creates contradictory totals.

## Repro steps (journey)

1. Wizard → Investments.
2. Add a bucket with:
   - Monthly contribution: `$1,000`
   - Recurring monthly contributions: **unchecked**
3. Create dashboard.
4. Compare:
   - Allocation model/segments (shows $1,000/mo allocated)
   - Cashflow/projection drivers that treat non-recurring as $0

## Expected vs Actual

- **Expected**
  - All surfaces agree on the cashflow meaning of “recurring off”.
  - Either:
    - Non-recurring is modeled as $0/mo everywhere, or
    - Non-recurring is modeled as a one-time contribution with explicit timing (and displayed as such).
- **Actual**
  - Allocation may treat it as monthly dollars while projections/tax treat it as 0.

## Scope

- **In scope**
  - Establish a single modeling rule for non-recurring contributions.
  - Apply consistently across allocation, cashflow timeline, tax engine inputs, and projections.
- **Out of scope**
  - Adding a full “one-time contribution scheduling” UI unless chosen as the modeling rule.

## Acceptance criteria (testable)

- When recurring is off:
  - Allocation model does not count the bucket as $/month (unless modeled explicitly as one-time with timing).
  - Projections and taxes match the same rule.
- Cross-surface totals reconcile for a simple test session (no hidden monthly dollars).

## Requirements Ledger placeholders

- **UXR-1**
  - “Recurring monthly contributions” toggle must match modeled behavior: OFF means **$0/mo** everywhere (not “one-time”).
- **FIN-1**
  - Effective monthly contribution for investments is:
    - `effectiveMonthlyContribution = isRecurringMonthly ? monthlyContribution : 0`
- **FIN-2**
  - No scheduling UI is introduced in this ticket (OFF means paused, not a one-time event).
- **TECH-1**
  - Dashboard allocation segments must use the same recurring semantics as `CashflowTimelineManager` (which already treats non-recurring as $0/mo).
  - Evidence: `BudgetDashboardViewModel.buildSegments` gates investment segment cents by `isRecurringMonthly`.

## Owner routing

- **Primary**: Fin + Dev
- **Consult**: Design (copy/affordance)

## Test plan

- Unit: allocation segment computation honors recurring toggle.
- Integration: wizard setup → dashboard totals reconcile.

### Evidence

- **Unit**: `src/domain/viewmodels/BudgetDashboardViewModel.test.ts` (“investment recurring toggle”)
- **E2E**: `e2e/proj-1-recurring-toggle-consistency.spec.ts`

## Design QA mode required?

- **Browser end-to-end required**: **Yes**

