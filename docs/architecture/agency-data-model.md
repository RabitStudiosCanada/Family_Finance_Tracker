# Agency Data Model Overview

This document summarizes the core data entities that power the Family Finance Tracker's "agency" economy. It outlines how users, learner profiles, tasks, income sources, credit-card accounts, and billing cycles relate to each other, and details the formulas used to derive agency, projected expenses, and balances. The goal is to help contributors understand current assumptions and open questions before diving into implementation.

## Core Entities and Relationships

### Users
- **Attributes:** `id`, `household_id`, `name`, `email`, `role` (guardian, learner, administrator), `status` (active, invited, archived).
- **Responsibilities:** Own their learner profiles, authenticate into the system, and receive notifications tied to agency changes.
- **Relationships:**
  - One-to-one with a **Learner Profile** when the role is `learner`.
  - One-to-many with **Tasks** (guardians create them, learners complete them).
  - One-to-many with **Income Sources** (primarily guardians).
  - Many-to-many with **Credit-Card Accounts** through household membership.

### Learner Profiles
- **Attributes:** `id`, `user_id`, `display_name`, `grade_level`, `agency_balance`, `agency_limits` (per day/week), `behavior_flags`.
- **Responsibilities:** Track the learner-specific state for agency calculation, including earned, committed, and pending amounts.
- **Relationships:**
  - Belongs to a **User** (`user_id`).
  - Has many **Tasks** assigned to the learner.
  - References many **Transactions** (task completions, purchases, reimbursements) for agency tracking.

### Tasks
- **Attributes:** `id`, `creator_user_id`, `assignee_profile_id`, `title`, `description`, `agency_award`, `due_at`, `status`, `verification_required`.
- **Responsibilities:** Represent actionable work that yields agency when completed and verified.
- **Relationships:**
  - Created by a guardian **User**.
  - Assigned to a **Learner Profile**.
  - Generates **Task Transactions** when completion is logged.

### Income Sources
- **Attributes:** `id`, `household_id`, `type` (allowance, chore, gift, other), `recurrence`, `amount`, `currency`, `next_run_at`, `status`, `auto_contribute_goal_id`.
- **Responsibilities:** Define recurring or one-off inflows that convert to either agency or actual funds, optionally routing a percentage to shared savings goals.
- **Relationships:**
  - Belong to a household (implied via `household_id`).
  - Feed into **Projected Expenses**, **Savings Goals**, and agency accrual logic when earmarked for learners.

### Credit-Card Accounts
- **Attributes:** `id`, `household_id`, `issuer`, `display_name`, `credit_limit`, `statement_day`, `payment_due_day`, `status`.
- **Responsibilities:** Provide the credit instruments that learners transact against, enabling supervised spending.
- **Relationships:**
  - Belong to a household and can be shared across learners.
  - Have many **Billing Cycles**.
  - Link to **Transactions** (purchases, credits, adjustments).

### Billing Cycles
- **Attributes:** `id`, `credit_card_account_id`, `cycle_start`, `cycle_end`, `statement_issued_at`, `payment_due_at`, `minimum_due`, `statement_balance`, `status`.
- **Responsibilities:** Anchor financial reporting windows for balances, minimum payments, and reconciliation.
- **Relationships:**
  - Belong to a **Credit-Card Account**.
  - Aggregate many **Transactions** occurring between `cycle_start` and `cycle_end`.

### Transactions (Cross-Cutting Entity)
- **Attributes:** `id`, `source_type` (`task`, `card_purchase`, `card_payment`, `adjustment`), `source_id`, `profile_id`, `amount`, `currency`, `occurred_at`, `clearing_state`, `metadata`.
- **Responsibilities:** Capture atomic movements of agency or funds.
- **Relationships:**
  - Belong to a **Learner Profile** when linked to agency.
  - Belong to a **Billing Cycle** when linked to credit-card activity.

### Savings Goals
- **Attributes:** `id`, `household_id`, `name`, `target_amount`, `currency`, `target_date`, `owner_profile_id` (nullable for shared guardian goals), `status`, `visibility` (`household`, `guardian`, `learner`), `auto_contribution_rule` (flat amount or % of inflow), `created_at`.
- **Responsibilities:** Represent intentional saving objectives that can absorb agency or cash contributions.
- **Relationships:**
  - May belong to a specific **Learner Profile** or be shared at the household level.
  - Link to **Income Sources** via optional auto contribution rules.
  - Aggregate **Goal Contributions** transactions regardless of origin (learner commitment or guardian transfer).

### Goal Contributions (Ledger Extension)
- **Attributes:** `id`, `goal_id`, `profile_id`, `amount`, `currency`, `source_type` (`income`, `agency_commitment`, `manual_adjustment`), `occurred_at`, `is_committed` (true when funds are reserved but not yet funded), `notes`.
- **Responsibilities:** Track commitments and fulfilled transfers that move agency or cash toward a savings goal.
- **Relationships:**
  - Belong to a **Savings Goal** and optionally a **Learner Profile**.
  - Reference originating **Transactions** when commitments reduce agency balances.

### Projected Spending Lists
- **Attributes:** `id`, `household_id`, `billing_cycle_id` (optional), `name`, `notes`, `created_by`, `created_at`, `status` (`draft`, `planned`, `committed`).
- **Responsibilities:** Provide structured groupings of expected purchases (e.g., grocery runs) so learners see upcoming obligations before they post to a card statement.
- **Relationships:**
  - Contain many **Projected Spending Items**.
  - Can be linked to a **Billing Cycle** when spending is tied to a specific credit card statement.

### Projected Spending Items
- **Attributes:** `id`, `projected_spending_list_id`, `description`, `category`, `estimated_amount`, `quantity`, `priority`, `assigned_profile_id` (optional), `expected_purchase_at`, `status` (`planned`, `ordered`, `fulfilled`).
- **Responsibilities:** Itemize anticipated purchases, enabling granular agency reservation and comparison to actual spending.
- **Relationships:**
  - Belong to a **Projected Spending List**.
  - May reserve **Agency** for a **Learner Profile** when items are assigned.

## Derived Metrics and Formulas

### Agency Calculation
Agency quantifies a learner's available influence, combining earned value and obligations.

```
Agency Balance = Earned Agency + Recurring Agency Allowances - Committed Agency - Goal Commitments - Penalties
```

Where:
- **Earned Agency** = Sum of `agency_award` from completed and verified **Tasks** during the active period.
- **Recurring Agency Allowances** = Sum of active **Income Sources** amounts earmarked for the learner within the measurement window.
- **Committed Agency** = Sum of pending obligations (e.g., reserved for purchases or upcoming chores).
- **Goal Commitments** = Sum of agency reserved toward **Savings Goals** that has not yet been fulfilled by guardian funding.
- **Penalties** = Sum of negative adjustments (missed tasks, behavior flags).

### Projected Expenses
Used to forecast upcoming cash or agency outflows for household planning.

```
Projected Expenses = Σ (Upcoming Billing Cycle Minimum Due) + Σ (Scheduled Income Source Outflows) + Σ (Planned Purchases) + Σ (Committed Savings Contributions)
```

- **Upcoming Billing Cycle Minimum Due**: For each active **Billing Cycle**, the minimum payment expected by `payment_due_at`.
- **Scheduled Income Source Outflows**: Allowances that convert to cash transfers rather than agency.
- **Planned Purchases**: Tasks, **Projected Spending Items**, or transactions marked as pending commitments.
- **Committed Savings Contributions**: Automatic or manual transfers pledged to **Savings Goals** before they are funded.

### Savings Goal Progress
Used to track momentum toward targets for both learners and guardians.

```
Goal Progress (%) = (Fulfilled Contributions ÷ Target Amount) × 100
```

- **Fulfilled Contributions**: Sum of `Goal Contributions` where `is_committed = false` (i.e., cash funded) within the goal's currency.
- Track separate metrics for learner agency commitments vs. guardian-funded cash to surface educational insights.

### Credit-Card Balance
Defines accountability for shared credit use.

```
Statement Balance = Σ (Transactions.amount within cycle, signed) + Carryover Adjustments
Available Credit = Credit Limit - Current Balance
```

- **Current Balance** accumulates all cleared transactions up to the present time (including pending charges if configured).
- **Carryover Adjustments** include payments posted after the statement date and manual corrections.

## Validation Rules and Edge Cases

- **Task Completion Verification:** Agency is only awarded when a guardian or an automated rule marks the task as verified. Pending tasks contribute to `Committed Agency` but not `Earned Agency`.
- **Mid-Cycle Credit Limit Changes:** When the credit limit changes during an active billing cycle, recompute `Available Credit` and annotate the cycle with the effective limits for auditability.
- **Split Transactions:** Allow a single card purchase to be split across multiple learner profiles. Each split creates a child transaction referencing the parent `source_id`, and must ensure the sum of splits equals the original amount.
- **Currency Consistency:** All amounts within a household must share the same currency or be converted before aggregation to avoid inconsistent balances.
- **Negative Agency Guardrails:** Prevent agency balances from dropping below configured floor values (e.g., zero or guardian-defined overdraft limits).
- **Statement Sync Drift:** When importing statements from providers, enforce idempotency by matching on `transaction_id`, `amount`, and `occurred_at` to avoid duplicates.
- **Recurring Income Alignment:** Ensure `next_run_at` adjusts correctly when recurrence schedules cross daylight savings or involve skipped occurrences.
- **Goal Visibility Rules:** Clarify when learner-facing goals should reveal total household contributions versus learner-only commitments.
- **Projected Spending Granularity:** Determine how to reconcile itemized projected amounts with aggregated transactions, especially when receipts differ from estimates.
- **Learner Goal Commitments:** Define whether unfulfilled learner commitments revert to available agency at cycle close if guardians delay funding.

## Open Questions

- How should the system prioritize multiple income sources when they overlap (e.g., allowance plus bonus) and exceed maximum daily agency limits?
- What is the expected behavior when a split transaction spans multiple billing cycles due to late posting dates?
- Should penalties be capped per cycle, or can they create negative agency balances that carry over indefinitely?
- How do we model shared tasks (multiple learners contributing) so that agency awards are allocated fairly without double counting?
- What reconciliation flow should handle discrepancies between provider statements and locally tracked transactions?
- How do mid-cycle credit limit increases affect previously calculated projected expenses and alerts?

