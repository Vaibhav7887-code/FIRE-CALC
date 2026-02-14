# ONB-1 — Wizard Next validates whole form (off-step errors block progress)

## Customer / job-to-be-done

- **Customer**: New user onboarding into a complex budgeting/projections setup.
- **JTBD**: “Let me complete setup step-by-step without being blocked by things I haven’t reached yet.”

## Problem statement

The wizard’s step navigation can trigger validation across the entire form, causing progression to fail due to invalid fields on later steps that are not visible on the current step.

## Repro steps (journey)

1. Wizard → Goals step: add a goal.
2. Make the goal invalid (e.g., clear a required name field).
3. Navigate back to Assumptions.
4. Click Next.

## Expected vs Actual

- **Expected**
  - Next validates only current step fields and proceeds if the current step is valid.
  - If a step has errors, they are shown within that step.
- **Actual**
  - Next can be blocked by off-step validation errors not visible in the current step.

## Scope

- **In scope**
  - Step-scoped validation and error presentation.
  - Focus management when validation fails.
- **Out of scope**
  - Changing field-level validation rules.

## Acceptance criteria (testable)

- Next validates only fields belonging to the current step.
- Back navigation always works.
- When Next fails, the first invalid field in the current step is focused and shows an inline error.

## Requirements Ledger placeholders

- **UXR-1**
  - Wizard “Next” validates only the current step fields; off-step errors must not block progress.
- **FIN**
  - N/A
- **TECH-1**
  - Step → field mapping exists and is used by navigation validation.
  - Evidence: `SetupWizardPage.stepValidationFields` and `form.trigger(fields)`.

## Owner routing

- **Primary**: Dev
- **Consult**: Design (error copy)

## Test plan

- Browser: create invalid later-step data; verify earlier steps can still advance.
- Unit: step navigation calls validation only for the current step field list.

### Evidence

- **E2E**: `e2e/onb-1-step-scoped-validation.spec.ts`

## Design QA mode required?

- **Browser end-to-end required**: **Yes**

