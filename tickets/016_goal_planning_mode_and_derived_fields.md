# GOAL-3 — Target date ↔ contribution coupling is implicit

## Customer / job-to-be-done

- **Customer**: FIRE planner planning goals either by date or by monthly amount.
- **JTBD**: “Let me choose whether I’m planning by target date or by contribution, without surprising auto-changes.”

## Problem statement

The goal editor links **Target date** and **Monthly contribution** bidirectionally. Editing one can silently change the other, and the UI does not clearly indicate which is derived or what mode the user is in.

## Repro steps (journey)

1. Wizard → Goals: create a goal with Target amount.
2. Enter Monthly contribution and observe Target date auto-populate/change.
3. Edit Target date and observe Monthly contribution recalculation.

## Expected vs Actual

- **Expected**
  - UI clearly indicates a planning mode (e.g., “Plan by date” vs “Plan by payment”).
  - Derived fields are visually marked and predictable.
- **Actual**
  - Coupling occurs with limited explanation; can feel surprising.

## Scope

- **In scope**
  - Define and implement explicit planning mode UX.
  - Make derived-field behavior predictable and explained.
- **Out of scope**
  - Adding new goal types or advanced schedules.

## Acceptance criteria (testable)

- User can select planning mode (date-driven vs payment-driven).
- UI clearly indicates which field is derived and when it updates.
- No silent recalculation without an explicit mode and visible indication.

## Requirements Ledger placeholders

- **UXR-1 — Predictable editing model for linked fields**: **Complete**  
  - **Screens touched**: Wizard → Goals (per-goal card)  
  - **Evidence**:
    - Per-goal `Planning mode` selector with required labels/values and derived-field pill + helper copy.
    - Derived field is read-only with muted styling; driver field remains editable.
  - **Files**:
    - `src/components/wizard/steps/StepGoalFunds.tsx`
    - `src/components/ui/TextInput.tsx`
    - `src/components/ui/DateInput.tsx`
  - **Tests**:
    - `e2e/goal-3-planning-mode-derived-fields.spec.ts`

- **FIN-1 — Deterministic month-granularity derivations**: **Complete**  
  - **Evidence**: Month-granularity math uses `monthsBetweenIso` + `addMonthsIso`; derived monthly uses `ceil(remaining/months)` and derived date uses `ceil(remaining/monthly)` with the specified edge cases.  
  - **Files**:
    - `src/domain/managers/goals/GoalFundPlanningManager.ts`
    - `src/domain/managers/debts/DateMonthMath.ts`
  - **Tests**:
    - `e2e/goal-3-planning-mode-derived-fields.spec.ts`

- **TECH-1 — Loop prevention + safe draft defaulting**: **Complete**  
  - **Evidence**:
    - Mode-gated one-way writes prevent bidirectional loops.
    - Wizard draft restore passes through schema parsing to apply defaults (old drafts missing `planningMode`).
    - `planningMode=="targetDate"` enforces required `targetDateIso` and blocks Next.  
  - **Files**:
    - `src/components/wizard/WizardSchema.ts`
    - `src/components/wizard/SetupWizardPage.tsx`
    - `src/components/wizard/WizardDraftValuesNormalizer.ts`
  - **Tests**:
    - `e2e/goal-3-planning-mode-derived-fields.spec.ts`

## Owner routing

- **Primary**: Design
- **Consult**: Dev, Fin

## Test plan

- Browser: verify mode toggles and derived-field indications behave as specified.
- Unit: derived value calculation consistent across edits.

## Design QA mode required?

- **Browser end-to-end required**: **Yes**

