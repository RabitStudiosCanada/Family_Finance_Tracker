# Analytics Dashboards Overview

This document outlines the learner-facing analytics dashboards to help track engagement, financial health, and motivation.

## Key Performance Indicators (KPIs)

1. **Agency Trend Over Time**
   - Visualize monthly agency scores to highlight growth or regression.
   - Include projected vs. actual agency usage lines.
   - Surface milestones (e.g., badge unlocks) as annotations.
2. **Spending Categories Breakdown**
   - Show month-over-month spending per category in stacked bars.
   - Highlight overspending alerts compared to user-defined budgets.
   - Provide quick filters for timeframe (30/60/90 days) and category types.
3. **Savings Goal Progress**
   - Display percent-to-target gauges for each active goal with forecasted completion dates.
   - Contrast learner agency commitments vs. guardian cash funding to highlight collaboration.
   - Flag goals that are off-track based on remaining time vs. average contribution cadence.
4. **Task Completion Rewards**
   - Track tasks completed vs. outstanding to reveal reward eligibility.
   - Summarize earned badges, unlocked rewards, and pending incentives.
   - Call out feedback prompts triggered by missed tasks.

## Mockups & Wireframes

Detailed mockups reside in [`docs/features/mockups/`](./mockups/). Key artifacts include:

- [`learner-agency-trend-wireframe.md`](./mockups/learner-agency-trend-wireframe.md)
- [`spending-categories-dashboard-wireframe.md`](./mockups/spending-categories-dashboard-wireframe.md)
- [`task-rewards-progress-wireframe.md`](./mockups/task-rewards-progress-wireframe.md)

## Data Aggregation Logic

Backend aggregation will live in `server/services/analytics.py`:

- `get_monthly_agency_trend(learner_id)`
  - Fetch agency interactions, smooth into weekly averages, roll up by month.
  - Return projected vs. actual usage based on learner goals stored in `agency_goals` table.
- `get_spending_summary(learner_id, start_date, end_date)`
  - Join transactions with category metadata to compute totals, budgets, and variances.
  - Produce cumulative totals for stacked charts and highlight overspending flags.
- `get_goal_progress(learner_id, include_household=false)`
  - Aggregate goal_contributions by status to separate committed vs. funded amounts.
  - Calculate projected completion date using trailing four-week contribution average.
  - Return household-level rollups when `include_household` is true for guardian dashboards.
- `get_task_reward_progress(learner_id)`
  - Aggregate completed tasks, earned badges, and outstanding incentives.
  - Emit triggers for feedback prompts when completion dips below threshold.

Frontend consumption will occur in `client/src/views/LearnerDashboard.vue`:

- Use `useAnalyticsStore()` to request aggregated datasets via REST endpoints.
- Render agency trend line charts, spending bar charts, and reward progress cards.
- Display savings goal progress gauges with tooltips showing learner vs. guardian funding breakdown.
- Show contextual feedback prompts when API payload includes `action_required` flags.

## Acceptance Criteria for Learner Features

### Badges

- Learners see a badge carousel summarizing earned and locked badges with tooltips.
- Badge unlocks appear automatically when `completed_tasks` meets the badge threshold.
- Unlock events trigger celebratory animation and update agency trend annotations within one refresh cycle.
- Accessibility: badge elements must be keyboard navigable and include descriptive ARIA labels.

### Feedback Prompts

- When task completion rates drop below configured thresholds, a feedback prompt banner appears.
- Banner includes a quick survey link and contextual suggestions tailored to missed task categories.
- Dismissing the prompt snoozes it for seven days unless new triggers occur.
- Prompt visibility and snooze state persist across sessions via learner profile settings.
