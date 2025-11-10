# Flow: Award Task-Based Agency

```mermaid
sequenceDiagram
    participant L as Learner App
    participant API as Backend API
    participant Tasks as Task Service
    participant AC as Agency Calculator
    participant Notify as Notification Service

    L->>API: PATCH /tasks/{id}/complete
    API->>Tasks: Update task status (completed)
    Tasks->>API: Task marked completed (awaiting verification)
    API->>Notify: Alert guardian for verification (optional)
    Guardian->>API: PATCH /tasks/{id}/verify
    API->>Tasks: Validate guardian permissions & update status
    Tasks->>API: Task status = verified
    API->>AC: Trigger agency award event (task id, profile id, amount)
    AC->>AC: Calculate net agency delta (apply penalties/bonuses)
    AC->>API: Updated learner agency balance
    API->>Notify: Send learner notification (agency awarded)
    API-->>L: Updated task status & agency balance
```

**Notes:**
- If verification times out, the flow reverts to pending and no agency is granted.
- Optional automation rules may auto-verify based on evidence uploads or integrations.
