# GOAL-2 — Goal completion redirect rules not reflected in goal projections

## Customer / job-to-be-done

- **Customer**: FIRE planner chaining goals (finish one goal then redirect to another).
- **JTBD**: “When a goal completes, freed cashflow should move to my chosen destination and projections should reflect it.”

## Problem statement

Goal completion redirect rules exist (source: GoalFund completion → destination), but downstream goal projections do not reflect the redirected cashflow. This makes the redirect system feel non-functional and breaks trust in projections.

## Repro steps (journey)

1. Wizard → Goals.
2. Create **Goal A**:
   - Name: “Emergency fund”
   - Target: `$6,000`
   - Monthly contribution: `$500`
   - Start date: current month
3. Create **Goal B**:
   - Name: “Down payment”
   - Target: `$20,000`
   - Monthly contribution: `$200`
   - Start date: current month
4. Configure redirect rule: **When Goal A is reached → redirect freed monthly amount to Goal B**.
5. Create dashboard.
6. Compare Goal B projection with and without the redirect.

## Expected vs Actual

- **Expected**
  - After Goal A completes, Goal B receives Goal A’s freed monthly amount and accelerates.
  - Projections and summaries are consistent with the redirect rule.
- **Actual**
  - Goal B projection does not change (redirect not reflected), or changes are not traceable/consistent across surfaces.

## Scope

- **In scope**
  - Ensure redirect rules affect downstream goal projections consistently across projection surfaces.
  - Ensure redirect effects are explainable/traceable (at minimum in projections).
- **Out of scope**
  - New redirect rule types or complex routing graphs unless already present.
  - Full scenario/what-if system.

## Acceptance criteria (testable)

- With redirect enabled, Goal B reaches a higher balance earlier (or reaches target sooner) compared to baseline.
- Redirect effects are consistent across:
  - Goal projections
  - Any cashflow summary that includes goals
- Projections provide at least a minimal “redirect applied” driver trace (source → destination, month index, amount).

## Requirements Ledger placeholders

- **UXR-1**
  - Redirect rules must be **observable** on the dashboard via an “impact + trace” panel.
  - Redirect trace must be understandable: month, amount, and source label.
- **FIN-1**
  - Redirect-to-goal is treated as an **extra same-month contribution** to the destination goal (when applied by the cashflow timeline).
- **FIN-2**
  - Goal targets act as a **ceiling**: contributions are capped so the goal does not exceed its target (freed remainder follows redirect rules).
- **FIN-3**
  - Redirect effects must be **conserved**: applied cents + unallocated cents equals freed cents (no silent loss).
- **TECH-1**
  - Dashboard goal projections must be driven from the **cashflow timeline goal contribution schedule** (`CashflowTimelineManager.build(session).timeline.goalFundSeries`) to avoid projection drift.
  - Evidence: `BudgetDashboardViewModel` uses `VariableContributionProjectionManager` with the timeline schedule for goal balance series.
  - Evidence: dashboard provides a `GoalRedirectImpactPanel` similar to `DebtPayoffImpactPanel`.

## Owner routing

- **Primary**: Fin + TechLead + Dev
- **Consult**: Design (explainability surface and labels)

## Test plan

- Unit: redirected contribution stream increases destination goal monthly inflow after source completion.
- Integration: wizard setup with redirect → dashboard shows changed goal projection.
- Regression: no-redirect baseline unchanged.

### Evidence

- **Unit**: `src/domain/viewmodels/BudgetDashboardViewModel.test.ts` (“goal redirect impacts” case)
- **E2E**: `e2e/goal-2-redirect-to-goal-affects-projection.spec.ts`
- **UI**: `src/components/dashboard/GoalRedirectImpactPanel.tsx` rendered from `src/components/dashboard/DashboardPage.tsx`

## Design QA mode required?

- **Browser end-to-end required**: **Yes**

