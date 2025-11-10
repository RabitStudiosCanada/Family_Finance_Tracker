# Flow: Manage Projected Spending Lists

This sequence diagram captures how guardians plan and adjust itemized projected spending so agency reflects upcoming obligations.

```mermaid
sequenceDiagram
  participant Guardian
  participant ClientApp
  participant API
  participant DB
  participant Ledger

  Guardian->>ClientApp: Open "Projected Spending" workspace
  ClientApp->>API: GET /projected-spending?cycleId=<optional>
  API->>DB: Fetch lists and items
  DB-->>API: List payload with item status
  API-->>ClientApp: Respond with structured list data
  ClientApp-->>Guardian: Render grocery list with running totals

  Guardian->>ClientApp: Add new item ("Milk", $5)
  ClientApp->>API: POST /projected-spending/{listId}/items
  API->>DB: Insert projected_spending_items row
  API->>Ledger: Reserve agency for assigned learner (if provided)
  Ledger-->>API: Updated committed agency totals
  API-->>ClientApp: Item created response with updated totals
  ClientApp-->>Guardian: Show revised agency bar (available vs. projected)

  Guardian->>ClientApp: Mark purchase as fulfilled after checkout
  ClientApp->>API: PATCH /projected-spending/items/{itemId}
  API->>DB: Update item status to fulfilled and actual amount
  API->>Ledger: Convert commitment to actual transaction linking to billing cycle
  Ledger-->>API: Adjust agency (release difference or apply delta)
  API-->>ClientApp: Confirmation payload
  ClientApp-->>Guardian: Display reconciliation summary and prompt to attach receipt
```

## Notes
- API should return aggregated totals per list to keep the UI responsive without recalculating client-side.
- Ledger interactions must reconcile partial fulfillment—if the actual amount differs from the estimate, adjust the learner's agency accordingly.
- Support collaborative editing by locking lists during concurrent sessions or implementing optimistic updates with conflict resolution payloads.
