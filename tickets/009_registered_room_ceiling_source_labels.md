# SET-3 — Registered ceiling redirect sources labeled generically (“Ceiling”)

## Customer / job-to-be-done

- **Customer**: FIRE planner using TFSA/RRSP room ceilings and redirects.
- **JTBD**: “When I set ceiling redirect rules, I must be able to tell exactly which account/bucket they apply to.”

## Problem statement

Redirect rule sources for registered-room ceilings are labeled generically (e.g., “Ceiling”), making it unclear which TFSA/RRSP bucket (and owner) the rule corresponds to. This increases misconfiguration risk.

## Repro steps (journey)

1. Wizard → Investments: add TFSA and RRSP buckets (with owners if applicable).
2. Wizard → Review: view “Ceiling redirect rules”.
3. Observe rule source labels for registered-room ceilings.

## Expected vs Actual

- **Expected**
  - Source labels uniquely identify the ceiling source (e.g., “TFSA (Alice) ceiling reached”).
- **Actual**
  - Source is displayed as a generic “Ceiling” label.

## Scope

- **In scope**
  - Improve labeling for registered-room ceiling sources consistently across editors and summaries.
- **Out of scope**
  - Changing the underlying ceiling/room math.

## Acceptance criteria (testable)

- Each registered-room ceiling rule source label includes:
  - Account type (TFSA/RRSP)
  - Bucket name (if any)
  - Owner/member (if applicable)
- Labels are consistent in Review and any other surfaces where rules appear.

## Requirements Ledger placeholders

- **UXR-1**
  - Registered ceiling redirect sources must be unambiguous at the point of configuration (Review).
- **FIN**
  - N/A
- **TECH-1**
  - RegisteredRoomCeiling source labels are resolved from investment kind + bucket name + owner display name.
  - Evidence: `StepReview.SourceLabelResolver` handles `RegisteredRoomCeiling`.

## Owner routing

- **Primary**: Design + Dev

## Test plan

- Browser: review step shows unambiguous labels with multiple registered buckets.
- Regression: non-registered sources unchanged.

### Evidence

- **E2E**: `e2e/set-3-registered-ceiling-source-labels.spec.ts`

## Design QA mode required?

- **Browser end-to-end required**: **Yes**

