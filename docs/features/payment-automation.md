# Payment Automation Reminders

## User Stories

### Pre-Due-Date Reminders
- **As a** credit card holder, **I want** to receive a reminder several days before my payment due date **so that** I can avoid late fees.
  - Notification channels: configurable per account for PWA push, email, and SMS.
  - Configuration options: per-account lead time (e.g., 1, 3, 7 days), channel enable/disable toggles, and quiet hours.
- **As a** budgeting parent, **I want** to receive reminders for shared accounts before the due date **so that** my partner and I coordinate payments.
  - Notification channels: multi-recipient email/SMS and shared PWA devices.
  - Configuration options: assign multiple contacts, set escalation channel if primary is unacknowledged, per-account lead time.
- **As a** busy professional, **I want** snooze options on reminders **so that** I can delay but not forget the payment.
  - Notification channels: PWA push and email with actionable buttons.
  - Configuration options: snooze duration presets (e.g., 1 day, 3 days), per-channel snooze availability, reminder re-fire limit.

### Statement-Arrival Reminders
- **As a** meticulous planner, **I want** to be notified when a new statement arrives **so that** I can review charges before the payment due date.
  - Notification channels: PWA push, email, SMS.
  - Configuration options: statement arrival triggers per account, channel-specific message templates, optional receipt attachments for email.
- **As a** parent overseeing teen spending, **I want** shared statement notifications **so that** I can monitor spending and teach accountability.
  - Notification channels: shared PWA push devices, SMS to guardians.
  - Configuration options: per-account guardian list, notification throttling to avoid spam if multiple statements post quickly.
- **As a** user with multiple cards, **I want** digest-style notifications **so that** I receive one summary instead of many individual alerts.
  - Notification channels: daily digest email, consolidated PWA push summary.
  - Configuration options: digest schedule (daily/weekly), per-account inclusion toggles, threshold for including only statements over a certain balance.

## Backend Jobs and Webhooks

### Data Inputs
- Billing-cycle metadata per account: statement closing date, due date offset, grace period rules.
- Payment history: last payment timestamp, amount, status.
- Notification preferences: per-account channel settings, lead times, digest preferences, snooze states.

### Scheduling Logic
- Extend `server/jobs/credit_payments.py` (or equivalent) with cron tasks that:
  1. Calculate next statement arrival date based on the most recent closing date and cycle length.
  2. Calculate next payment due date using closing date plus configured offset; adjust for weekends/holidays where business rules require.
  3. Generate reminder windows (e.g., N days before due date) per account based on user configuration.
  4. Check if reminders have already fired or been acknowledged; respect snooze and digest settings.
  5. Persist reminder jobs (e.g., enqueue to Celery, Sidekiq, or server-native job queue) to fire notifications via chosen channels.

### Event-Driven Triggers
- Webhook consumers for statement-arrival events from card issuers or aggregation APIs.
- Manual upload endpoints for users entering statement PDFs; trigger statement notifications upon successful upload.
- Payment confirmation webhooks to mark reminders as satisfied and prevent duplicate alerts.

### Notification Delivery
- PWA push: integrate with service worker to send notifications using Web Push protocol.
- Email: utilize transactional email service (e.g., SendGrid, Postmark) with templates per reminder type.
- SMS: integrate with provider (e.g., Twilio) for time-sensitive reminders; handle opt-in compliance.
- Logging/auditing: store send attempts, delivery confirmations, and user actions (acknowledge/snooze) for analytics.

## Integration Options

### Manual Logging
- **Description:** Users manually enter statement dates, due dates, and payment confirmations within the app.
- **Pros:**
  - No external dependencies or API costs.
  - Simplified security footprint; all data originates from user input.
  - Immediate MVP viability.
- **Cons:**
  - Higher user effort; risk of stale or missing data leading to missed reminders.
  - Limited automation; relies on user diligence.
  - Less scalable for households with many accounts.
- **Security Considerations:**
  - Ensure role-based access control for shared accounts.
  - Validate inputs to prevent injection attacks when storing metadata.
  - Provide audit trails for manual changes to billing metadata.

### API Aggregation Services
- **Description:** Integrate with financial data aggregation APIs (e.g., Plaid, Yodlee, Finicity) that supply statement and due-date metadata.
- **Pros:**
  - Automated data synchronization reduces user workload.
  - Potential to retrieve real-time transactions and balances for richer reminders.
  - Supports scale across many institutions.
- **Cons:**
  - Ongoing costs per connected account; vendor lock-in risk.
  - Requires handling API downtime, rate limits, and consent renewal flows.
  - Compliance obligations (e.g., data retention, secure storage) increase implementation complexity.
- **Security Considerations:**
  - Must securely store OAuth tokens/credentials; consider hardware security modules or vault services.
  - Follow aggregation provider requirements for encryption in transit and at rest.
  - Implement robust monitoring for suspicious activity or data exfiltration.
  - Provide users with transparent consent management and data access logs.

### Hybrid Approach
- **Description:** Start with manual entry while offering optional API linkage for automated accounts.
- **Pros:**
  - Flexible adoption; users choose automation level.
  - Gradual rollout reduces immediate integration costs.
  - Manual fallback ensures continuity if API integration fails.
- **Cons:**
  - Requires dual data pipelines and reconciliation logic.
  - Complexity in determining authoritative source per account.
  - Additional UI/UX considerations to guide users through configuration.
- **Security Considerations:**
  - Maintain clear separation between manual and automated data sources.
  - Ensure consistent auditing regardless of source.
  - Need user education on sharing credentials and managing linked accounts.
