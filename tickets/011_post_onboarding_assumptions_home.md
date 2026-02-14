# SET-1 — No post-onboarding Assumptions home for global model knobs

## Customer / job-to-be-done

- **Customer**: FIRE planner iterating on assumptions (tax year, inflation, horizon).
- **JTBD**: “After setup, let me adjust assumptions without restarting or editing JSON.”

## Problem statement

Core global assumptions that materially affect projections appear to be editable only during onboarding (wizard). After creating a dashboard session, users cannot adjust assumptions in a dedicated place, forcing “start over” or JSON import/export.

## Repro steps (journey)

1. Complete wizard and create dashboard.
2. Attempt to change:
   - Tax year
   - Inflation %
   - Projection horizon (years)
3. Observe available UI entry points.

## Expected vs Actual

- **Expected**
  - A dedicated Assumptions home exists post-onboarding.
  - Projections show “assumptions in use” read-only with deep links.
- **Actual**
  - Assumptions appear trapped in onboarding; no post-onboarding editing surface.

## Scope

- **In scope**
  - Define IA for Assumptions vs Settings vs Scenarios.
  - Provide post-onboarding navigation to edit assumptions safely.
- **Out of scope**
  - Full scenario system (unless already planned).

## Acceptance criteria (testable)

- User can edit tax year/inflation/horizon after onboarding without resetting baseline data.
- Projections disclose the assumptions in use and provide a path to edit them in the Assumptions home.

## Requirements Ledger placeholders

- **UXR-1**
  - Dashboard discloses assumptions in use (tax year, inflation %, horizon) and deep-links to an edit home.
- **UXR-2**
  - Post-onboarding assumptions edit home exists at `/assumptions`.
- **FIN-1**
  - Assumptions are global inputs for projections and are expressed in:
    - Tax year (integer year)
    - Inflation (%) annual
    - Projection horizon (years)
- **TECH-1**
  - Assumptions edits update the current session via `BudgetSessionCoordinator` and persist to storage.
  - Evidence: `SessionAssumptionsUpdater`, `/assumptions` route.

## Owner routing

- **Primary**: Design + TechLead
- **Consult**: Dev, Fin

## Test plan

- Browser: change assumptions post-onboarding; verify projections update consistently.
- Regression: exported session preserves assumptions and can be imported back.

### Evidence

- **Unit**: `src/domain/managers/assumptions/SessionAssumptionsUpdater.test.ts`
- **E2E**: `e2e/set-1-assumptions-home-edit-updates-dashboard.spec.ts`
- **UI**: `/assumptions` route + dashboard assumptions summary in `src/components/dashboard/DashboardPage.tsx`

## Design QA mode required?

- **Browser end-to-end required**: **Yes**

