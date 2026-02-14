# Portal Audit → QA Backlog (File-based Tickets)

Status legend: `NotStarted` | `InProgress` | `Blocked` | `Done`

## Global execution order

- P0 trust breakers first (projection correctness + cross-surface drift)
- Then P1 (flow/guardrails + IA cohesion)
- Then P2 (polish/copy/secondary IA)

## Debts

1. **[P0][Done] DEBT-1 Target-payoff-date debts amortize but don’t affect cashflow/outflow/allocation**  
   - **Customer impact**: “Debt pays off for free” contradiction; severe trust breaker  
   - **Dependencies**: FIN model decision: implied payment representation + TECH allocation model rules  
   - Link: [`tickets/001_target_date_debt_included_in_cashflow_and_allocation.md`](001_target_date_debt_included_in_cashflow_and_allocation.md)

2. **[P0][Done] DEBT-2 Debt start date ignored in debt balance projections**  
   - **Customer impact**: Incorrect payoff timelines when debts start later  
   - **Dependencies**: FIN definition of interest accrual before start date  
   - Link: [`tickets/004_debt_start_date_respected_in_amortization.md`](004_debt_start_date_respected_in_amortization.md)

3. **[P0][Done] DEBT-3 Redirect rules to debts don’t affect debt payoff projections**  
   - **Customer impact**: Redirect system not trustworthy; payoff strategy outcomes unpredictable  
   - **Dependencies**: FIN definition for extra-principal application + TECH source-of-truth alignment  
   - Link: [`tickets/005_debt_redirect_rules_reflected_in_projections.md`](005_debt_redirect_rules_reflected_in_projections.md)

## Accounts / Cashflow

4. **[P0][Done] CASH-1 Wizard net income estimate ignores RRSP room (preview drift)**  
   - **Customer impact**: Core net income number wrong in onboarding; misallocation and distrust  
   - **Dependencies**: None  
   - Link: [`tickets/007_wizard_net_income_rrsp_room_preview_drift.md`](007_wizard_net_income_rrsp_room_preview_drift.md)

5. **[P1][Done] CASH-2 Household expense categories have no post-onboarding home**  
   - **Customer impact**: Users can’t review/edit categories; onboarding work feels wasted  
   - **Dependencies**: IA decision: persistent Cashflow/Expenses home vs summary-only dashboard  
   - Link: [`tickets/012_household_expense_categories_post_onboarding_home.md`](012_household_expense_categories_post_onboarding_home.md)

## Goals

6. **[P0][Done] GOAL-1 Goal start date ignored in goal projections**  
   - **Customer impact**: Incorrect projections; users can’t trust goal timelines  
   - **Dependencies**: FIN definition of start-date semantics (before-start behavior)  
   - Link: [`tickets/002_goal_start_date_respected_in_projections.md`](002_goal_start_date_respected_in_projections.md)

7. **[P0][Done] GOAL-2 Goal completion redirect rules not reflected in goal projections**  
   - **Customer impact**: Rules feel fake; downstream goals don’t respond  
   - **Dependencies**: FIN precedence + TECH source-of-truth decision (timeline vs standalone projection)  
   - Link: [`tickets/003_goal_redirect_rules_reflected_in_projections.md`](003_goal_redirect_rules_reflected_in_projections.md)

8. **[P2][Done] GOAL-3 Target date ↔ contribution coupling is implicit**  
   - **Customer impact**: Surprise auto-changes; reduced sense of control  
   - **Dependencies**: Design decision: planning mode UX  
   - Link: [`tickets/016_goal_planning_mode_and_derived_fields.md`](016_goal_planning_mode_and_derived_fields.md)

## Projections

9. **[P0][Done] PROJ-1 Recurring toggle inconsistently applied (allocation vs projection/tax)**  
   - **Customer impact**: Contradictory dollars; user can’t reconcile totals  
   - **Dependencies**: FIN decision: whether non-recurring contributions are supported as one-time events  
   - Link: [`tickets/006_recurring_toggle_consistency_across_surfaces.md`](006_recurring_toggle_consistency_across_surfaces.md)

10. **[P1][Done] PROJ-2 Redirect/ceiling rule effects not observable/traceable in projections**  
   - **Customer impact**: “Why did my numbers change?” unclear; rules feel opaque  
   - **Dependencies**: IA rule: projections are read-only drivers with deep links; needs TECH event tracing decision  
   - Link: [`tickets/013_projection_rule_traceability_redirects_applied.md`](013_projection_rule_traceability_redirects_applied.md)

11. **[P2][Done] PROJ-3 Over-allocation hides deficit magnitude (warning only)**  
   - **Customer impact**: Budget feedback loop weaker; can’t see “how over”  
   - **Dependencies**: None  
   - Link: [`tickets/017_over_allocation_shows_shortfall_amount.md`](017_over_allocation_shows_shortfall_amount.md)

## Onboarding

12. **[P1][Done] ONB-1 Wizard Next validates whole form (off-step errors block progress)**  
   - **Customer impact**: Users get stuck due to hidden errors; abandonment risk  
   - **Dependencies**: None  
   - Link: [`tickets/014_wizard_step_scoped_validation.md`](014_wizard_step_scoped_validation.md)

13. **[P1][Done] ONB-2 Wizard progress not persisted (refresh loses setup)**  
   - **Customer impact**: Long setup is fragile; loss of progress kills trust and completion  
   - **Dependencies**: Product decision on persistence scope (local draft vs explicit save)  
   - Link: [`tickets/015_wizard_draft_persistence.md`](015_wizard_draft_persistence.md)

14. **[P2][Done] ONB-3 Returning user ambiguity: wizard defaults diverge from saved session**  
   - **Customer impact**: Confusion about “which plan is current”; accidental overwrite risk  
   - **Dependencies**: Product decision (wizard = create-new vs edit-baseline)  
   - Link: [`tickets/018_wizard_vs_dashboard_session_entrypoint.md`](018_wizard_vs_dashboard_session_entrypoint.md)

## Settings / IA cohesion (scattered features)

15. **[P1][Done] SET-1 No post-onboarding Assumptions/Settings home for global model knobs**  
   - **Customer impact**: Users must restart or use JSON; unsafe workflow for serious planning  
   - **Dependencies**: IA architecture: Assumptions vs Settings vs Scenarios baseline model  
   - Link: [`tickets/011_post_onboarding_assumptions_home.md`](011_post_onboarding_assumptions_home.md)

16. **[P1][Done] SET-2 Redirect destination validation errors can be invisible**  
   - **Customer impact**: “Why can’t I proceed?” confusion; appears buggy  
   - **Dependencies**: None  
   - Link: [`tickets/010_redirect_destination_inline_error_visibility.md`](010_redirect_destination_inline_error_visibility.md)

17. **[P2][Done] SET-3 Registered ceiling redirect sources labeled generically (“Ceiling”)**  
   - **Customer impact**: Misconfiguration risk; hard to tell what rule applies to what  
   - **Dependencies**: Naming/labeling convention; IA placement for ceiling rules  
   - Link: [`tickets/009_registered_room_ceiling_source_labels.md`](009_registered_room_ceiling_source_labels.md)

18. **[P2][Done] SET-4 Import/Export + reset controls scattered on dashboard**  
   - **Customer impact**: Operational actions mixed with projections; user anxiety and misclick risk  
   - **Dependencies**: IA decision: dedicated Import/Export area + navigation  
   - Link: [`tickets/008_import_export_dedicated_home.md`](008_import_export_dedicated_home.md)

