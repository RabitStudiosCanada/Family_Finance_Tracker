# Phase 2 Feature Implementation Plan: Projections & Savings

This document sequences the Phase 2 roadmap items (forward-looking adult budgeting) into deliverable workstreams across backend, frontend, data, and automation. It assumes Phase 1 capabilities (auth, cards, income, transactions, baseline agency engine) are production-ready or nearing completion.

## 1. Product Objectives for Phase 2

- **Projected expense planning** that lets adults log future obligations and convert them into actuals when paid.
- **Savings goal management** with contribution tracking, progress insight, and lifecycle workflows (complete, abandon).
- **Agency enhancements** so projected expenses and savings commitments adjust "safe to spend" guidance.
- **Category budgeting** enabling limits, progress visualisations, and early warning thresholds.

## 2. Dependencies & Prerequisites

- Phase 1 CRUD APIs for credit cards, income streams, and transactions are stable with authentication and role guards.
- Agency calculation service is modular to accept new inputs (projected expenses, savings commitments).
- Database migrations framework and seed scripts functional (`npm run migrate`, `npm run seed`).
- Frontend authenticated shell, API client, and state management (TanStack Query) are established.
- Testing harnesses (Jest, Vitest/RTL, API integration tests) operational from Phase 1.

## 3. Backend Workstreams

### 3.1 Data Model & Migrations

- `projected_expenses` table: fields for `id`, `user_id`, `card_id` (nullable), `amount`, `category`, `expected_date`, `notes`, `status` (`planned`, `committed`, `paid`, `cancelled`), timestamps.
- `savings_goals` table: `id`, `owner_user_id`, `name`, `target_amount`, `start_date`, `target_date` (nullable), `status` (`active`, `completed`, `abandoned`), `abandoned_reason`, metadata (category/tag).
- `savings_contributions` table: `id`, `goal_id`, `user_id`, `amount`, `source` (`manual`, `transfer`, future automation), `contribution_date`, `notes`.
- `category_budgets` table: `id`, `user_id`, `category`, `period` (`monthly`, `cycle`), `limit_amount`, `warning_threshold` (default 0.85), `period_start`/`period_end` handling.
- Update `agency_snapshots` (or create extension table) to persist `projected_expense_total`, `savings_commitments_total`, and `safe_to_spend` metrics per snapshot.
- Seed fixtures representing at least one goal and projected expense for demo family.

### 3.2 Services & Business Logic

- **Projected Expense Service**
  - CRUD operations with validation (date ≥ today, amount > 0).
  - Transition flow: `planned → committed` (approved by adult), `committed → paid` (converts to real transaction via service call), `committed → cancelled` (records reason).
  - Integration with transaction service to mark projected expense as fulfilled when actual transaction logged.
- **Savings Goal Service**
  - Goal CRUD, status transitions (complete when `total_contributions ≥ target`, request abandonment with reason).
  - Contribution logging with optional association to actual transaction (if savings account transfer recorded).
  - Event hooks to notify agency calculator when commitments change.
- **Category Budget Service**
  - Define budgets per user/category, compute utilisation per period leveraging transactions (and optionally projected expenses).
  - Provide analytics endpoint returning spend vs budget, threshold flags, reset logic per cycle/month.
- **Agency Calculator Enhancements**
  - Include projected expenses (status `planned` and `committed`) as obligations.
  - Include scheduled savings contributions (manual commitments or target pacing) when computing `safe_to_spend`.
  - Expose breakdown endpoints: `available_credit`, `projected_outflows`, `savings_reserves`, `safe_to_spend`.
- **Notifications & Cron Jobs**
  - Nightly job to reduce projected expenses as dates approach (send reminders at -3/-1 days).
  - Weekly digest summarising goal progress and category warnings.

### 3.3 API Endpoints

| Module             | Endpoints                                                                                                                                                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Projected Expenses | `GET/POST /projected-expenses`, `PATCH /projected-expenses/:id`, `DELETE /projected-expenses/:id`, `POST /projected-expenses/:id/commit`, `POST /projected-expenses/:id/mark-paid`, `POST /projected-expenses/:id/cancel`                                  |
| Savings Goals      | `GET/POST /savings-goals`, `GET /savings-goals/:id`, `PATCH /savings-goals/:id`, `POST /savings-goals/:id/contributions`, `DELETE /savings-goals/:id/contributions/:contributionId`, `POST /savings-goals/:id/complete`, `POST /savings-goals/:id/abandon` |
| Category Budgets   | `GET/POST /category-budgets`, `PATCH /category-budgets/:id`, `DELETE /category-budgets/:id`, `GET /category-budgets/summary?period=current`                                                                                                                |
| Agency Summary     | Extend existing `GET /dashboard/summary` or add `GET /agency/forecast` for safe-to-spend metrics and warnings                                                                                                                                              |

- Apply RBAC: adults/admins only during Phase 2. Learner scope arrives in later phases.
- Validation schemas (zod/joi) for requests; include numeric precision and category enumeration alignment with existing transactions.

### 3.4 Testing & Quality

- Unit tests covering new services (state transitions, agency math).
- Integration tests for each endpoint ensuring JWT enforcement and business rules (e.g., cannot mark paid without linking transaction).
- Regression tests verifying agency snapshots include new fields.
- Seed-based smoke test ensuring nightly cron handles reminders without side effects.

## 4. Frontend Workstreams

### 4.1 Foundations & Shared Components

- Extend API client with projected expenses, savings goals, budgets modules (query keys, mutation hooks).
- Add reusable UI components: `ProgressBar`, `StatusBadge`, `GoalCard`, `BudgetAlert`, `ProjectedExpenseListItem`.
- Update global state/toast system to surface success, warnings (category near limit, goal milestone).

### 4.2 Feature Screens

| Route                          | Description                                                                        | Key Widgets                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `/planning/projected-expenses` | Create, edit, and track upcoming expenses.                                         | `ProjectedExpenseTable`, `ProjectedExpenseFormModal`, `LinkTransactionDrawer`, `ReminderSettingsPanel` |
| `/planning/savings-goals`      | Manage goals and contributions.                                                    | `GoalGrid`, `GoalDetailDrawer`, `ContributionForm`, `GoalTimeline`                                     |
| `/planning/budgets`            | Configure category budgets and monitor utilisation.                                | `BudgetOverviewCards`, `BudgetProgressList`, `BudgetInsightsChart`, `ThresholdWarningModal`            |
| Dashboard Enhancements         | Surface "Safe to Spend", next projected expenses, and savings progress highlights. | `SafeToSpendTile`, `UpcomingObligationsList`, `SavingsProgressWidget`                                  |

### 4.3 Interaction Flows

- Projected expense creation flow with default category templates (grocery, utilities). Optional duplicate-from-previous cycle.
- Conversion flow: when marking expense as paid, open transaction selector or create new transaction prefilled from projection.
- Savings goal contribution flow with quick-add presets and ability to mark as recurring (store as future commitment for Phase 3 automation).
- Category budget warnings: banner + modal on dashboard when spending exceeds threshold; allow adjusting limit inline.

### 4.4 Frontend Testing

- Component tests for progress bars, summary cards.
- Integration tests using Mock Service Worker to validate flows (create projected expense, mark as paid).
- E2E scenario: login → create projected expense → see safe-to-spend adjust → add savings contribution → see goal progress.

## 5. Automation, Ops, and Documentation

- Update `.env.example` with new feature toggles (e.g., reminder email lead times) if required.
- Extend OpenAPI/Swagger documentation to include new endpoints and schema definitions.
- Add cron job documentation and scheduling guidance to `docs/`.
- Prepare data migration runbook for production (backup, migrate, seed adjustments).
- Update onboarding docs for adults describing new planning tools (future user manual section).

## 6. Delivery Milestones

1. **Data & API foundations** – migrations, repositories, basic CRUD endpoints, unit tests.
2. **Projected expense feature complete** – backend services + frontend UI + integration tests.
3. **Savings goals feature complete** – contributions, progress visuals, completion/abandon flows.
4. **Category budgeting & dashboards** – budgets API, dashboard integration, warning notifications.
5. **Agency enhancement & polish** – safe-to-spend calculations, summary widgets, reminder cron jobs.
6. **QA & Documentation** – regression test suite expanded, OpenAPI + internal docs updated, demo data refreshed.

## 7. Risks & Mitigations

- **Agency complexity increases:** Document formulas and add deterministic tests for safe-to-spend scenarios using fixtures.
- **User confusion around projections vs actuals:** Provide clear UI states, tooltips, and enforce linking to transactions to avoid double-counting.
- **Budget period alignment edge cases:** Support both calendar month and credit cycle via helper utilities; write tests for month-end boundary conditions.
- **Notification fatigue:** Allow configurable thresholds and digest frequency via user preferences.
- **Data migration downtime:** Use transactional migrations with rollback scripts; run in staging prior to production.

## 8. Definition of Done Checklist

- All new tables migrated and seed data updated; migrations idempotent.
- API endpoints validated, authorised, and documented (OpenAPI, README summary).
- Frontend pages responsive (desktop/tablet) and pass accessibility linting.
- Agency summary reflects projections/savings across dashboards and passes unit/integration tests.
- Cron jobs scheduled with logging and failure alerts.
- QA sign-off: backend unit/integration coverage ≥ target, frontend critical path covered by E2E test.

This plan prepares the team to deliver Phase 2 "Projections & Savings" functionality, extending the adult experience into proactive budgeting while reinforcing code quality and operational readiness.
