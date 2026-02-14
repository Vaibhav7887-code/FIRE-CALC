# SET-4 — Import/Export and reset controls scattered on dashboard

## Customer / job-to-be-done

- **Customer**: Any user managing sessions safely.
- **JTBD**: “Let me import/export/reset data without fear of breaking my plan or clicking the wrong thing.”

## Problem statement

Import/Export and destructive/reset actions are clustered on the dashboard (a projections/summaries surface). This mixes “read” and “danger/ops” actions and increases misclick risk and anxiety.

## Repro steps (journey)

1. Create a dashboard session.
2. Observe dashboard header controls:
   - Download Excel
   - Export JSON / Import JSON
   - Reset / Start from scratch

## Expected vs Actual

- **Expected**
  - File/data operations live in a dedicated **Import/Export** (or Data) area with clear confirmation/recovery.
  - Dashboard primarily supports viewing and adjusting allocations, not file ops.
- **Actual**
  - Operational actions are present beside core dashboard content.

## Scope

- **In scope**
  - Define IA placement for Import/Export and destructive actions.
  - Provide navigation entry point to the dedicated area.
- **Out of scope**
  - Redesigning the export formats.

## Acceptance criteria (testable)

- Dashboard contains at most a deep link to Import/Export (no file pickers or JSON textareas on dashboard).
- Import/Export area has clear success/failure messaging and “are you sure?” confirmations for destructive actions.

## Requirements Ledger placeholders

- **UXR-1**
  - Dashboard exposes only a deep link to operational actions (Import/Export/Resets).
- **FIN**
  - N/A
- **TECH-1**
  - Dedicated Data home exists at `/data` and contains Import/Export + reset actions.
  - Evidence: `src/app/data/page.tsx`, `src/components/data/DataPage.tsx`.

## Owner routing

- **Primary**: Design
- **Consult**: Dev (routing)

## Test plan

- Browser: verify import/export actions are reachable and no longer on dashboard.
- Regression: existing export files remain identical.

### Evidence

- **E2E**: `e2e/set-4-data-home-removes-ops-from-dashboard.spec.ts`

## Design QA mode required?

- **Browser end-to-end required**: **Yes**

