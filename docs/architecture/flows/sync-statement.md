# Flow: Sync Credit Card Statement

```mermaid
sequenceDiagram
    participant S as Statement Provider
    participant Sync as Sync Worker
    participant API as Backend API
    participant DB as Database
    participant Reco as Reconciliation Service

    S-->>Sync: Push statement (webhook) or Sync->>S: Fetch statement
    Sync->>API: POST /statements/import (payload: cycle metadata, transactions)
    API->>DB: Upsert billing cycle (idempotent on account + cycle_start)
    loop For each transaction
        API->>Reco: Match transaction by provider id & amount
        alt Match Found
            Reco->>DB: Update existing transaction (set clearing_state)
        else New
            API->>DB: Insert transaction (source=card_purchase)
        end
    end
    API->>DB: Recompute statement balance & minimum due
    API-->>Sync: Import summary (created, matched, discrepancies)
    Sync-->>S: Acknowledge receipt (if webhook)
```

**Notes:**
- Reconciliation flags discrepancies (amount mismatch, missing learner profile) for manual review.
- Cycle state transitions to `statement_issued` once the sync completes.
