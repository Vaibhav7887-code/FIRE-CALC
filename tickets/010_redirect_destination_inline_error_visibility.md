# SET-2 — Redirect destination validation errors can be invisible

## Customer / job-to-be-done

- **Customer**: User configuring redirect rules during onboarding.
- **JTBD**: “When I make a mistake, the UI tells me exactly what to fix without hunting.”

## Problem statement

Redirect rules require a destination when the destination kind is not “Unallocated”. Validation can fail, but the UI does not consistently render an inline error near the destination picker, making the wizard feel broken.

## Repro steps (journey)

1. Wizard → Review (ceiling redirect rules).
2. Set destination kind to “Goal fund” (or “Debt loan” / “Investment bucket”).
3. Do **not** select a destination item.
4. Attempt to proceed/submit.

## Expected vs Actual

- **Expected**
  - Inline error appears next to destination selector: “Destination is required.”
  - The error is visible wherever redirect rules can be edited (inline + review list).
- **Actual**
  - Validation may block progress but the error is not visible inline in some editors.

## Scope

- **In scope**
  - Ensure redirect destination errors are displayed inline consistently.
  - Ensure focus management brings the user to the failing field.
- **Out of scope**
  - Changing redirect rule semantics.

## Acceptance criteria (testable)

- When destination kind != Unallocated and destinationId is empty:
  - An inline error message is visible adjacent to the destination selector.
  - The wizard cannot finish until corrected.
- Error rendering works for all redirect rule editor variants used in the wizard.

## Requirements Ledger placeholders

- **UXR-1**
  - Redirect destination selector must show an inline error when a destination is required but missing.
  - Error must be visible in both inline pickers and the Review redirect rules editor.
- **FIN**
  - N/A
- **TECH-1**
  - Wire `redirectRules.*.destinationId` errors to `FieldErrorText` in all redirect rule editor variants.
  - Evidence: `CeilingRedirectInlinePicker` + `StepReview.RedirectDestinationPicker`.

## Owner routing

- **Primary**: Dev
- **Consult**: Design (copy style)

## Test plan

- Browser: create invalid redirect rule → verify inline error appears.
- Unit: rule editor component renders error for missing destination.

### Evidence

- **E2E**: `e2e/set-2-redirect-destination-inline-error.spec.ts`

## Design QA mode required?

- **Browser end-to-end required**: **Yes**

