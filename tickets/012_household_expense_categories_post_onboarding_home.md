# CASH-2 — Household expense categories have no post-onboarding home

## Customer / job-to-be-done

- **Customer**: Budgeting user maintaining expense categories over time.
- **JTBD**: “Let me review and edit my expense breakdown after onboarding so my plan stays accurate.”

## Problem statement

Users can enter detailed household expense categories during onboarding, but post-onboarding the dashboard appears to surface only a single roll-up “Household” segment. There is no obvious post-onboarding place to view/edit categories, making onboarding work feel lost and reducing long-term usefulness.

## Repro steps (journey)

1. Wizard → Household expenses: add multiple categories (e.g., Rent, Utilities, Groceries).
2. Create dashboard.
3. Attempt to locate and edit the category breakdown.

## Expected vs Actual

- **Expected**
  - A post-onboarding “Cashflow/Expenses” home exists that owns category CRUD and roll-ups.
  - Dashboard shows a summary with a deep link to the category home.
- **Actual**
  - Only a roll-up segment is visible; categories are not accessible for editing.

## Scope

- **In scope**
  - Define IA for expense categories post-onboarding.
  - Provide UX pathway from dashboard to edit categories.
- **Out of scope**
  - Rebuilding budgeting taxonomy; adding new category analytics.

## Acceptance criteria (testable)

- User can view/edit household expense categories after onboarding.
- Dashboard retains roll-up summary but offers a clear deep link to category details.
- Changes to categories update totals consistently across cashflow/projections.

## Requirements Ledger placeholders

- **UXR-1**
  - Provide a post-onboarding home for household categories at `/expenses`.
  - Dashboard must deep-link to it from the allocation context (“Manage household categories”).
- **UXR-2**
  - The expenses home supports category CRUD (add/edit/remove/reorder) and shows remainder against allocated monthly.
- **FIN-1**
  - All amounts are **monthly**; household roll-up uses `household.allocatedMonthly`.
- **TECH-1**
  - Expenses home must edit the **current session** via `BudgetSessionCoordinator` and persist through `SessionStorageManager`.
  - Evidence: `src/app/expenses/page.tsx`, `src/components/expenses/ExpensesPage.tsx`, `SessionHouseholdBudgetUpdater`.

## Owner routing

- **Primary**: Design + Dev

## Test plan

- Browser: edit a category post-onboarding; verify rollup totals update.
- Regression: onboarding still creates categories correctly.

### Evidence

- **Unit**: `src/domain/managers/household/SessionHouseholdBudgetUpdater.test.ts`
- **E2E**: `e2e/cash-2-expenses-home-edit-updates-dashboard.spec.ts`
- **UI**: `/expenses` route + dashboard deep link in `src/components/dashboard/DashboardPage.tsx`

## Design QA mode required?

- **Browser end-to-end required**: **Yes**

