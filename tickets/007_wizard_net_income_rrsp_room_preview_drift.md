# CASH-1 — Wizard net income estimate ignores RRSP room (preview drift)

## Customer / job-to-be-done

- **Customer**: FIRE planner using onboarding cashflow to decide allocations.
- **JTBD**: “Net income (estimated) shown during setup must match the dashboard for the same inputs.”

## Problem statement

The wizard cashflow preview constructs a “session-like” object for tax estimation that ignores **RRSP contribution room** (and may omit other member fields). This can make the wizard’s **Net income (estimated)** differ from the dashboard’s net income for the same configuration.

## Repro steps (journey)

1. Wizard → Household members:
   - Set annual employment income (e.g., `$100,000`)
   - Set **RRSP contribution room (annual)** (e.g., `$20,000`)
2. Wizard → Investments:
   - Add RRSP bucket with recurring monthly contribution (e.g., `$1,000/mo`)
3. Go to Review step and record wizard cashflow summary net income estimate.
4. Create dashboard and record dashboard net income estimate.

## Expected vs Actual

- **Expected**
  - Wizard net income estimate matches dashboard net income estimate for identical inputs (within rounding tolerance).
  - RRSP room affects deductions as defined by the model.
- **Actual**
  - Wizard preview sets RRSP room to zero (or otherwise diverges), causing mismatched net income.

## Scope

- **In scope**
  - Make wizard preview use the same member inputs (incl. RRSP room) as the session used on dashboard.
  - Ensure wizard and dashboard net income estimates reconcile.
- **Out of scope**
  - Changes to tax engine math itself (unless a bug is discovered).

## Acceptance criteria (testable)

- For identical wizard inputs, wizard cashflow net income estimate equals dashboard net income estimate (±$1).
- RRSP room is included in wizard preview calculations.
- No regression for sessions without RRSP contributions/room.

## Requirements Ledger

- **UXR-CASH-1 — Wizard net income preview matches dashboard**
  - **Status**: Complete
  - **Evidence**
    - **Screens**: Wizard cashflow summary (Review) + Dashboard net income header
    - **Files**: `src/components/wizard/WizardCashflowSummaryCard.tsx`
    - **Tests**: `e2e/cash-1-wizard-dashboard-net-income-parity.spec.ts`

- **FIN-CASH-1 — RRSP room affects deduction consistently**
  - **Status**: Complete
  - **Evidence**
    - **Files**: `src/domain/managers/tax/HouseholdTaxEngineManager.ts`
    - **Tests**: `e2e/cash-1-wizard-dashboard-net-income-parity.spec.ts` (RRSP room + RRSP contrib parity)
  - **Notes**: RRSP deductible behavior is capped by room per tax engine; wizard now uses the same mapped session inputs as dashboard.

- **TECH-CASH-1 — Wizard preview uses the same mapping as dashboard**
  - **Status**: Complete
  - **Evidence**
    - **Files**: `src/components/wizard/WizardCashflowSummaryCard.tsx`, `src/domain/adapters/WizardSessionMapper.ts`
    - **Tests**: `e2e/cash-1-wizard-dashboard-net-income-parity.spec.ts`
  - **Notes**: Wizard tax preview is derived from `WizardSessionMapper.map(...)` to prevent drift.

## Owner routing

- **Primary**: Fin + Dev

## Test plan

- Unit: wizard preview uses rrsp room values when computing estimated net income.
- Integration: E2E wizard → dashboard net income match with RRSP configured.

## Design QA mode required?

- **Browser end-to-end required**: **Yes** (wizard vs dashboard comparison)

## Design QA

- **Mode**: Browser end-to-end (Playwright)
- **Status**: PASS
- **Command**: `npx playwright test e2e/cash-1-wizard-dashboard-net-income-parity.spec.ts`

