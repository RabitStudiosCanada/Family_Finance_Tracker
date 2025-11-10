# Phase 1 Data Model Overview

## Core Entities

| Entity | Purpose | Key Attributes |
| --- | --- | --- |
| **roles** | Defines access tiers (administrator, adult, learner). | `code`, `name`, descriptive metadata. |
| **users** | Represents authenticated people in a household. | `role_id`, `email`, `password_hash`, `is_active`, audit timestamps. |
| **credit_cards** | Tracks each revolving credit account. | `nickname`, `issuer`, `last_four`, `credit_limit_cents`, cycle anchors (`cycle_anchor_day`, `statement_day`, `payment_due_day`), autopay flag, lifecycle dates. |
| **income_streams** | Catalogues recurring or ad-hoc income sources. | `name`, `amount_cents`, `frequency`, `next_expected_date`, optional notes. |
| **credit_card_cycles** | Materialises each billing cycle for a card. | `cycle_number`, `cycle_start_date`, `statement_date`, `payment_due_date`, balances and minimum payments, closing markers. |
| **transactions** | Stores every money movement that touches the agency engine. | `type` (expense/income/payment/transfer), `amount_cents`, `category`, optional `credit_card_id` or `income_stream_id`, `card_cycle_id`, lifecycle flags, merchant memo fields. |
| **agency_snapshots** | Persists credit/backed agency roll-ups for reporting. | `calculated_for`, `credit_agency_cents`, `backed_agency_cents`, `available_credit_cents`, `projected_obligations_cents`, contextual notes. |

## Relationships & Constraints

* **Role assignment** – `users.role_id` references `roles.id` with `RESTRICT` deletion to protect referential integrity.
* **Ownership** – Financial records (`credit_cards`, `income_streams`, `transactions`, `agency_snapshots`) all reference the owning `users.id` and cascade on delete so demo data cleans up consistently.
* **Card cycles** – `credit_card_cycles.credit_card_id` links each cycle to its card; a composite unique index on `(credit_card_id, cycle_number)` prevents duplicate cycles. Day-of-month anchors (`cycle_anchor_day`, `statement_day`, `payment_due_day`) are constrained between 1 and 31.
* **Transaction integrity** –
  * `transactions.amount_cents` disallows zero values.
  * Expense and payment transactions must have a `credit_card_id` (enforced by a CHECK clause).
  * Money columns (limits, balances, obligations) use integer cents with non-negative or positive checks where appropriate.
* **Income cadence** – `income_streams.frequency` is enumerated to Phase 1-supported cadences (weekly → annually) and amounts must be positive.
* **Auditability** – Every table includes `created_at`/`updated_at` timestamps; transactional tables also record the event time (`occurred_at` or `calculated_at`). Optional `archived_at` on users supports soft deletes without breaking history.
* **Agency history** – `agency_snapshots` enforces a single snapshot per user per `calculated_for` date to ensure chronological accuracy.

These structures cover Phase 1 needs: multiple credit cards per adult, recurring income, per-cycle tracking, and agency calculations grounded in transactional history. Future phases (savings goals, learner program) can extend the model without breaking the initial foundation.
