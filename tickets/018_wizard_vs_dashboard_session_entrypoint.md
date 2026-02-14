# ONB-3 — Returning user ambiguity: wizard defaults diverge from saved session

## Customer / job-to-be-done

- **Customer**: Returning user with an existing plan.
- **JTBD**: “When I come back, I should know whether I’m editing my current plan or starting a new one.”

## Problem statement

The wizard initializes from factory defaults even when a saved dashboard session exists. Users can land on `/` and see numbers/configurations that do not match their saved session, creating confusion and risk of accidental overwrite.

## Repro steps (journey)

1. Complete wizard and create dashboard session.
2. Navigate back to `/` (wizard) or reload the root route.
3. Compare wizard defaults vs dashboard session values.

## Expected vs Actual

- **Expected**
  - Clear entrypoint:
    - “Resume/Edit baseline” (uses saved session), or
    - “Create new plan” (starts from defaults) with explicit confirmation.
- **Actual**
  - Wizard shows defaults regardless of saved session state.

## Scope

- **In scope**
  - Define and implement a returning-user entrypoint decision.
  - Prevent accidental baseline divergence/overwrite.
- **Out of scope**
  - Multi-session management UI (unless required by design).

## Acceptance criteria (testable)

- If a saved session exists, user is explicitly offered:
  - Resume/edit existing baseline, and
  - Start new plan
- The UI clearly indicates which mode the user is in.

## Requirements Ledger placeholders

- **UXR-1**
  - If a dashboard session exists, the root route (`/`) shows an explicit choice:
    - Go to dashboard (resume)
    - Start a new plan (clears saved session + starts wizard fresh)
  - Wizard is blocked until the user chooses.
- **FIN**
  - N/A
- **TECH-1**
  - Use a persisted “dashboard created” flag to detect returning users.
  - Evidence: `DashboardCreatedFlagStorageManager` + `SetupWizardPage.returningUserGate`.

## Owner routing

- **Primary**: Design
- **Consult**: TechLead + Dev

## Test plan

- Browser: create session, return to `/`, verify user sees explicit choice.
- Regression: first-time users still start with wizard defaults.

### Evidence

- **E2E**: `e2e/onb-3-returning-user-entrypoint.spec.ts`

## Design QA mode required?

- **Browser end-to-end required**: **Yes**

