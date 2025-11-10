# Phase 1 Vertical Slice Implementation Plan

This plan sequences the Phase 1 scope (adult/parent tools) into shippable increments across backend, frontend, and automation workstreams. It builds on the existing data model and scaffolding that landed in the repository.

## 1. Product Goals for Phase 1

- **Secure authentication & role enforcement** for admins and adults.
- **Credit card & income management** so adults can model their real household finances.
- **Transaction ingestion and categorisation** covering expenses, income, transfers, and payments.
- **Agency engine** that calculates credit/backed agency snapshots each cycle.
- **Adult dashboard** surfacing balances, obligations, upcoming payments, and alerts.

## 2. Backend Workstreams

### 2.1 Infrastructure & Foundations
- Environment config loader (`config/`) pulling secrets from `.env` with validation (zod or joi).
- Database connection manager (Knex instance) and repository helpers (`db/index.js`, table-specific repositories).
- Error handling middleware and response normalisation utilities.
- Auth utilities: password hashing (bcrypt), JWT issuing/verification, role guard middleware.

### 2.2 Domain Modules & Endpoints

| Module | Responsibilities | Routes |
| --- | --- | --- |
| **Auth** | Login, logout (token blacklist or short TTL + refresh), session health | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| **Users** | Admin-only CRUD for adult accounts; password resets | `GET/POST/PATCH /users`, `POST /users/:id/reset-password` |
| **Credit Cards** | CRUD, cycle anchoring, autopay flags | `GET/POST/PATCH/DELETE /credit-cards`, `GET /credit-cards/:id/cycles` |
| **Income Streams** | CRUD, track next expected payout | `GET/POST/PATCH/DELETE /income-streams` |
| **Transactions** | CRUD + bulk import (CSV) for expenses/income/payments | `GET/POST/PATCH/DELETE /transactions`, `POST /transactions/import` |
| **Agency Engine** | Trigger agency recompute, view history | `POST /agency/recalculate`, `GET /agency/snapshots`, `GET /agency/snapshots/:date` |
| **Dashboard** | Aggregate roll-up for UI | `GET /dashboard/summary`, `GET /dashboard/upcoming-payments` |

Implementation details:
- Follow layered structure: `routes/`, `controllers/`, `services/`, `repositories/` inside `backend/src/`.
- Use transaction-aware services for multi-table updates (e.g., transaction CRUD updates card cycle balances, agency snapshot triggers).
- Add cron job (`node-cron`) to auto-close card cycles, generate next cycle, and compute agency snapshots nightly.
- Integrate Nodemailer (dev transport) for due-date reminders; stub web-push service for future PWA.

### 2.3 Testing & Quality Gates
- Unit tests for services (Jest + mocked repositories).
- Integration tests hitting Express app with Supertest (auth flow, CRUD, dashboard summary).
- Database migration smoke test (`npm run migrate` in CI) using SQLite for fast checks.
- Seed scripts for demo data (`backend/db/seeds/phase1_demo.js`).

## 3. Frontend Workstreams

### 3.1 Project Setup Enhancements
- Add React Router, TanStack Query, Axios API client, Tailwind base styles, component library scaffolding (`components/`, `hooks/`, `pages/`).
- Implement theming + typography consistent with dashboard needs.

### 3.2 Feature Routes & Views

| Route | Purpose | Key Components |
| --- | --- | --- |
| `/login` | Authentication screen | `AuthLayout`, `LoginForm` |
| `/dashboard` | Overview of agency, obligations, alerts | `DashboardLayout`, `AgencySummaryCard`, `UpcomingPaymentsList`, `CreditUtilisationChart` |
| `/credit-cards` | Card list & detail editing | `CreditCardList`, `CreditCardFormDrawer`, `CardCycleTimeline` |
| `/income` | Manage income streams | `IncomeStreamTable`, `IncomeFormModal` |
| `/transactions` | Transaction ledger, filters, CSV import | `TransactionTable`, `TransactionFilters`, `ImportDialog` |

Shared building blocks:
- `useAuth` hook for JWT storage/refresh, route guards.
- `apiClient` with interceptors for auth headers + error handling.
- Query keys per resource; optimistic updates for CRUD.
- Global state for flash messages/toasts, confirmation modals.

### 3.3 Testing & Tooling
- Add Vitest + React Testing Library for component/unit tests.
- Cypress (or Playwright) E2E smoke path: login → dashboard → create card → add transaction → see summary update.
- Storybook (optional) for complex components like charts/forms.

## 4. Cross-Cutting Concerns
- **Security:** Rate limiting on auth routes, password complexity enforcement, HTTPS-only cookies when deployed.
- **Validation:** Shared schema definitions (zod) used on both backend (request validation) and frontend (form validation) via shared package in future.
- **Observability:** Request logging (already via morgan) + structured logs for cron jobs; add error tracking hook to send to console/log file.
- **Documentation:** Keep OpenAPI/Swagger spec in sync (`backend/docs/openapi.yaml`) and frontend Storybook/docs.

## 5. Delivery Sequence
1. **Auth foundation** (backend auth routes, JWT middleware, frontend login flow, protected layout).
2. **Credit cards + income CRUD** (API + UI forms/tables) with demo data seeds.
3. **Transaction ingestion** (backend validations, card cycle balance updates, frontend ledger + import modal).
4. **Agency engine MVP** (service calculating available/backed agency, nightly cron, snapshots endpoint, dashboard summary card).
5. **Dashboard polish & alerts** (charts, upcoming payments, email reminders integration).
6. **QA hardening** (end-to-end test path, documentation updates, staging deploy checklist).

## 6. Risks & Mitigations
- **Complex agency calculations:** Start with deterministic unit tests using fixture datasets; encapsulate formulas in dedicated module with docstrings.
- **Cycle alignment edge cases:** Build factories/helpers to generate cycles and write regression tests for month-end boundary conditions.
- **CSV import variability:** Use a parsing library (Papa Parse) with validation feedback; limit Phase 1 scope to template-based imports.
- **Performance as data grows:** Use indexed columns (already defined in migrations) and paginate API responses (default 25 items) from the outset.

## 7. Definition of Done Checklist
- All routes protected by JWT + role guards as appropriate.
- Database migrations applied cleanly in CI and local environments.
- API endpoints documented (Swagger) and covered by integration tests.
- Frontend pages responsive, pass accessibility checks (eslint-plugin-jsx-a11y, axe manual run).
- Critical user flow covered by automated E2E test.
- README updated with run/test instructions and environment variables table before release.

This roadmap ensures Phase 1 delivers a cohesive, testable adult experience while laying groundwork for learner features in subsequent phases.
