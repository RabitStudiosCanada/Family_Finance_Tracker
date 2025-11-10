# Flow: Add Transaction

```mermaid
sequenceDiagram
    participant G as Guardian App
    participant API as Backend API
    participant TX as Transaction Service
    participant AC as Agency Calculator
    participant DB as Database

    G->>API: POST /transactions (payload: amount, profile, source)
    API->>TX: Validate payload & source context
    TX-->>API: Validation result
    alt Valid
        API->>DB: Insert transaction (pending)
        API->>AC: Trigger agency recalculation for profile
        AC->>DB: Fetch profile transactions & limits
        AC-->>API: Updated agency balance
        API-->>G: 201 Created (transaction id, new balance)
    else Invalid
        API-->>G: 422 Unprocessable Entity (error details)
    end
```

**Notes:**
- Split transactions invoke this flow once per allocation, referencing a parent transaction id.
- Validation includes credit limit checks when `source_type` is `card_purchase`.
