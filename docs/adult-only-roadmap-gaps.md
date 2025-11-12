# Adult-Only Release Backlog

## Context

The adult experience already exposes authenticated dashboards with real-time agency metrics, payment-cycle guidance, and quick expense entry powered by the Phase 1 services. The backend also ships full CRUD + business logic for credit cards, income streams, transactions, payment cycles, projected expenses, savings goals, and category budgets, complete with recalculation tests covering safe-to-spend thresholds.【F:frontend/src/pages/OverviewPage.jsx†L1-L200】【F:backend/src/services/creditCardsService.js†L1-L149】【F:backend/src/services/projectedExpensesService.js†L1-L178】【F:backend/src/services/savingsGoalsService.js†L1-L208】【F:backend/src/services/categoryBudgetsService.js†L1-L110】【F:backend/tests/finance.test.js†L400-L520】

Despite that foundation, several roadmap items remain before the adult-only product matches the Phase 1–2 vision. The list below captures those gaps in delivery order so the adult release can land without any learner scope.

## Remaining Roadmap Items (Adult Scope)

1. **Implement category budget tracking and warnings**
   _Roadmap reference:_ Phase 2 “Category budgeting” (track vs. budget, visual progress bars, warnings).”
   _Why it’s outstanding:_ The backend only supports CRUD on budget definitions; there is no spend-versus-limit computation or UI to display utilisation or alerts.【F:backend/src/services/categoryBudgetsService.js†L1-L110】【F:frontend/src/api/finance.js†L1-L68】
   _Key work:_ Extend services with summary endpoints that join transactions, add warning thresholds, and create a budgets workspace with progress indicators and dashboard notifications when limits are breached.

2. **Add reusable projected expense templates (grocery list)**
   _Roadmap reference:_ Phase 2 “Grocery list template (common categories).”
   _Why it’s outstanding:_ There is no template/catalog support in either the API or UI—the repository handles individual projections only—so adults must repeatedly re-enter routine expenses.【F:backend/src/services/projectedExpensesService.js†L1-L178】【F:frontend/src/api/finance.js†L1-L68】
   _Key work:_ Introduce predefined templates (DB table or configuration), expose clone-from-template endpoints, and surface quick-add options in the projected expense creation flow.

---

## Recently Completed

- ✅ **Ship in-app CRUD flows for credit cards & income streams**
  - Delivered modal-driven create/edit forms for adult credit cards and income streams with validation, optimistic cache refreshes, and archive actions surfaced inline on the tables.
  - Extended the finance API client with create/update/archive helpers to support the new UI flows and keep TanStack Query caches in sync.
- ✅ **Expose projected expense planning in the UI**
  - Introduced a projected expense workspace with filters, lifecycle actions, and detail modals, plus upcoming obligation highlights on the overview page for active adults.【F:frontend/src/pages/ProjectedExpensesPage.jsx†L1-L483】【F:frontend/src/pages/OverviewPage.jsx†L1-L330】
  - Expanded the finance API client with planning endpoints so the frontend can fetch, create, update, and transition projected expenses end-to-end.【F:frontend/src/api/finance.js†L1-L120】
- ✅ **Deliver savings goal management with progress visuals**
  - Added an adult savings goal workspace with list and detail views, contribution logging, and completion/abandon flows tied into backend services.【F:frontend/src/pages/SavingsGoalsPage.jsx†L1-L620】
  - Extended finance APIs and routing so the UI can fetch goals, contributions, and lifecycle mutations from the server.【F:frontend/src/api/finance.js†L1-L220】【F:backend/src/routes/savingsGoalsRoutes.js†L1-L70】【F:backend/src/services/savingsGoalsService.js†L1-L240】
  - Highlighted top active goals with progress bars on the overview dashboard to surface momentum at a glance.【F:frontend/src/pages/OverviewPage.jsx†L1-L260】

Prioritising the items above will close the remaining adult-phase roadmap gaps without touching any learner mechanics, clearing the path for a standalone adult launch.
