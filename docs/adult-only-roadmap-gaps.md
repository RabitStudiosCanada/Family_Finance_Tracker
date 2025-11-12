# Adult-Only Release Backlog

## Context

The adult experience already exposes authenticated dashboards with real-time agency metrics, payment-cycle guidance, and quick expense entry powered by the Phase 1 services. The backend also ships full CRUD + business logic for credit cards, income streams, transactions, payment cycles, projected expenses, savings goals, and category budgets, complete with recalculation tests covering safe-to-spend thresholds.【F:frontend/src/pages/OverviewPage.jsx†L1-L329】【F:backend/src/services/creditCardsService.js†L1-L149】【F:backend/src/services/projectedExpensesService.js†L1-L345】【F:backend/src/services/savingsGoalsService.js†L1-L240】【F:backend/src/services/categoryBudgetsService.js†L1-L222】【F:backend/tests/finance.test.js†L401-L960】

The remaining adult roadmap gaps have now shipped. This document captures the features that closed the release blockers so the adult launch can move forward without learner scope dependencies.

## Completed Roadmap Items (Adult Scope)

- ✅ **Implement category budget tracking and warnings**
  - Added budget summary services that join transactions, calculate utilisation, and surface warning/over-limit states alongside flexible period bounds.【F:backend/src/services/categoryBudgetsService.js†L1-L222】【F:backend/src/repositories/transactionsRepository.js†L1-L88】
  - Exposed the summaries via controller and routing layers and documented the flows with backend tests that validate listing, summaries, and full CRUD mutations.【F:backend/src/controllers/categoryBudgetsController.js†L1-L48】【F:backend/src/routes/categoryBudgetsRoutes.js†L1-L40】【F:backend/tests/finance.test.js†L838-L947】
  - Delivered an adult-facing budgets workspace with progress bars, warning badges, limit configuration, and overview dashboard alerts that highlight overspend risk.【F:frontend/src/pages/CategoryBudgetsPage.jsx†L1-L740】【F:frontend/src/pages/OverviewPage.jsx†L48-L206】【F:frontend/src/api/finance.js†L200-L264】

- ✅ **Add reusable projected expense templates (grocery list)**
  - Introduced a curated template catalog plus service helpers that compute default amounts, categories, and expected dates, with REST endpoints to list and clone templates into active projected expenses.【F:backend/src/config/projectedExpenseTemplates.js†L1-L33】【F:backend/src/services/projectedExpensesService.js†L229-L345】【F:backend/src/routes/projectedExpensesRoutes.js†L1-L80】
  - Updated the finance API client and projected expenses workspace to load templates, quick-add them with overrides, and surface template metadata in the UI, supported by Jest coverage for template listing and creation flows.【F:frontend/src/api/finance.js†L134-L199】【F:frontend/src/pages/ProjectedExpensesPage.jsx†L360-L731】【F:backend/tests/finance.test.js†L552-L603】

## Earlier Milestones

- ✅ **Ship in-app CRUD flows for credit cards & income streams**
  - Delivered modal-driven create/edit forms for adult credit cards and income streams with validation, optimistic cache refreshes, and archive actions surfaced inline on the tables.
  - Extended the finance API client with create/update/archive helpers to support the new UI flows and keep TanStack Query caches in sync.
- ✅ **Expose projected expense planning in the UI**
  - Introduced a projected expense workspace with filters, lifecycle actions, and detail modals, plus upcoming obligation highlights on the overview page for active adults.【F:frontend/src/pages/ProjectedExpensesPage.jsx†L1-L359】【F:frontend/src/pages/OverviewPage.jsx†L1-L329】
  - Expanded the finance API client with planning endpoints so the frontend can fetch, create, update, and transition projected expenses end-to-end.【F:frontend/src/api/finance.js†L1-L199】
- ✅ **Deliver savings goal management with progress visuals**
  - Added an adult savings goal workspace with list and detail views, contribution logging, and completion/abandon flows tied into backend services.【F:frontend/src/pages/SavingsGoalsPage.jsx†L1-L620】
  - Extended finance APIs and routing so the UI can fetch goals, contributions, and lifecycle mutations from the server.【F:frontend/src/api/finance.js†L200-L320】【F:backend/src/routes/savingsGoalsRoutes.js†L1-L70】【F:backend/src/services/savingsGoalsService.js†L1-L240】
  - Highlighted top active goals with progress bars on the overview dashboard to surface momentum at a glance.【F:frontend/src/pages/OverviewPage.jsx†L1-L329】

All adult-phase roadmap gaps are now addressed, clearing the path for a standalone adult launch.
