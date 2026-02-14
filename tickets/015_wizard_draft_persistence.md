# ONB-2 — Wizard progress not persisted (refresh loses setup)

## Customer / job-to-be-done

- **Customer**: New user completing a multi-step setup.
- **JTBD**: “If I refresh or close the tab mid-setup, I should be able to resume.”

## Problem statement

Wizard progress and entered values are not persisted mid-flow. Refreshing (or accidental navigation) resets the wizard to defaults, leading to data loss and abandonment.

## Repro steps (journey)

1. Fill multiple wizard steps with non-trivial inputs.
2. Refresh the page before creating the dashboard.

## Expected vs Actual

- **Expected**
  - Wizard restores draft inputs and step position (or prompts to restore).
- **Actual**
  - Wizard resets to default values.

## Scope

- **In scope**
  - Persist wizard draft values + current step index locally.
  - Provide “Resume setup” and “Start over” flows.
- **Out of scope**
  - Cloud sync, multi-device persistence.

## Acceptance criteria (testable)

- Refresh restores:
  - Step index
  - All entered values
- User can explicitly discard the draft and start fresh.
- Draft persistence does not override an existing saved dashboard session without explicit confirmation.

## Requirements Ledger placeholders

- **UXR-1**
  - Wizard must auto-save draft inputs + step index to prevent accidental data loss on refresh.
  - If a dashboard session already exists, resuming a wizard draft requires explicit user action.
- **FIN**
  - N/A
- **TECH-1**
  - Draft persistence uses versioned local storage snapshot (values + step index).
  - Evidence: `WizardDraftStorageManager` (`budgeting.wizard.draft.v1`).
- **TECH-2**
  - Dashboard creation sets a persisted “dashboard created” flag to prevent silent overwrite.
  - Evidence: `DashboardCreatedFlagStorageManager` (`budgeting.dashboard.created.v1`).

## Owner routing

- **Primary**: Design + Dev

## Test plan

- Browser: fill wizard → refresh → verify values restored.
- Regression: “Start from scratch” clears draft.

### Evidence

- **E2E**: `e2e/onb-2-wizard-draft-refresh-restores.spec.ts`

## Design QA mode required?

- **Browser end-to-end required**: **Yes**

