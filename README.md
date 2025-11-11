# FamilyFinance Platform

> A comprehensive family financial literacy system that teaches real-world credit mechanics, budgeting, and money management through experiential learning.

## 🎯 Vision

FamilyFinance is more than an expense tracker - it's a **financial education simulator** where children learn credit literacy, responsibility, and money management in a safe, gamified environment backed by real parental oversight. Adults get powerful tools for multi-account tracking with credit-cycle-aware budgeting, while learners experience authentic financial mechanics through tasks, virtual credit, and real loan agreements.

**Core Philosophy:** Teach children how credit, budgeting, and financial responsibility work by _doing_ rather than lecturing.

---

## 🏗️ System Architecture

### Monorepo Developer Setup

The codebase is organized as an npm workspaces monorepo with dedicated `backend/` and `frontend/` projects.

```text
family-finance-tracker/
├── backend/   # Express API + Jest tests
├── frontend/  # React + Vite + Tailwind UI
└── shared tooling (ESLint, Prettier, Husky, lint-staged)
```

#### Root scripts

| Command          | Description                                               |
| ---------------- | --------------------------------------------------------- |
| `npm install`    | Install dependencies for all workspaces.                  |
| `npm run lint`   | Run ESLint across backend and frontend packages.          |
| `npm run format` | Format files with Prettier.                               |
| `npm run test`   | Execute workspace-level test scripts (backend uses Jest). |

Each workspace exposes its own scripts (`npm run dev --workspace backend`, `npm run dev --workspace frontend`, etc.) for local development.

### Tech Stack

**Backend:**

- Node.js 20+ / Express 4
- PostgreSQL 16
- Knex.js (query builder + migrations)
- JWT authentication (jsonwebtoken + bcrypt)
- node-cron (scheduled tasks for cycle rollovers)
- Nodemailer (email notifications)
- web-push (PWA push notifications)

**Frontend:**

- React 18 with hooks
- React Router 6
- TanStack Query (React Query)
- Tailwind CSS 3
- Recharts (data visualization)
- date-fns (date manipulation)

**Infrastructure:**

- Docker + Docker Compose
- Nginx (reverse proxy, SSL termination)
- Let's Encrypt SSL certificates
- Self-hosted deployment model

**Currency & Regional Settings:**

- Canadian Dollar (CAD)
- Canadian credit system (300-900 score range)
- Bi-weekly pay period defaults (26 pays/year)
- 30-day credit cycles

---

## 🎭 User Roles & Capabilities

### Admin (Parents)

- Full system access
- Create/manage all accounts
- Approve learner tasks and agreements
- Set spending limits and rules
- Override decisions (with logging)
- Generate family financial reports

### Adult (Family Members)

- Track personal credit cards
- Manage income streams
- Enter transactions
- Create/contribute to savings goals
- View family dashboard (limited)

### Learner (Children)

- Earn virtual agency through tasks
- Submit expenses (requires approval if over limit)
- Apply for financing agreements
- Build credit score through behavior
- Generate periodic credit reports
- Contribute to savings goals

---

## 💰 Financial Concepts

### Agency System

**For Adults:**

```
Available Agency =
  (Sum of Credit Card Limits)
  - (Current Cycle Actual Spending)
  - (Projected Expenses Remaining This Cycle)
  - (Safety Buffer %)

CONSTRAINED BY:

Backed Agency =
  (Expected Income Before Due Date)
  - (Committed Savings Contributions)
  - (Learner Agency Owed)
  - (Upcoming Agreement Payments Parent Covers)
```

**Key Innovation:** The system tracks BOTH credit availability AND liquid funds to prevent over-extension.

**For Learners:**

```
Available Agency =
  (Earned Through Tasks)
  - (Current Cycle Spending)
  - (Scheduled Agreement Payments)
  - (Committed Savings Contributions)

Per-Cycle Spending Limit: Set by parents
Exception: Savings goals can exceed limit
```

### Learner Agency Owed (Critical to Parent Agency)

This is the amount parents immediately owe learners and must account for in their own budget:

```
Learner Agency Owed =
  (Approved Tasks Not Yet Paid Out on Payment Date)
  + (Down Payments & Full Purchase Amounts for Active Agreements)
  - (Monthly Payments Learner Has Made Back)
```

**Example:**

- Kid completes $15 task → Parent approves → Parent agency IMMEDIATELY -= $15
- Kid applies for $850 PC loan → Parent approves → Parent agency IMMEDIATELY -= $850
- Each month kid "pays" $67.71 → Parent agency += $67.71 (liability reduced)

### Credit Cycles

**Adult Cards:**

- 30-day billing cycles
- Statement close date
- Payment due date (typically 21 days after statement)
- Two-payment strategy: one at statement close, one at due date
- Tracks across multiple cards with different cycle dates

**Learner Cycles:**

- Synced to family credit cycles (teaching real-world timing)
- Report due dates aligned with parent payment dates
- Task earnings available immediately upon approval
- Agreement payments auto-deduct on scheduled dates

---

## 🎮 Learner Credit System

### Credit Score (350-900)

Modeled after Canadian credit bureaus (Equifax/TransUnion), but simplified for education.

**Starting Score:** 650 (Fair/Average)

**Score Factors:**

1. **Payment History (35%)** - On-time report submissions, agreement payments
2. **Credit Utilization (30%)** - Percentage of limit used per cycle
3. **Length of Credit History (15%)** - Time since account opened
4. **Task Completion Rate (10%)** - Reliability on assigned gig jobs
5. **Parental Feedback (10%)** - Quality ratings, manual adjustments

**Score Changes Trigger:**

- Report submitted on time: +5 to +15 points
- Report submitted late: -10 to -30 points
- Low utilization (<30%): +5 to +10 points per cycle
- High utilization (>70%): -5 to -20 points per cycle
- Agreement paid off: +20 to +50 points
- Agreement missed payment: -30 to -60 points
- Parent bonus (exceptional work): +5 to +25 points
- Parent penalty (irresponsibility): -5 to -25 points

### Available Agreements (Unlock Tiers)

Agreements are real financial products with terms, interest, and consequences.

#### Score 350-579 (Poor)

- **No agreements available**
- Must rebuild through tasks only
- Educational message: "Focus on completing tasks and submitting reports on time to rebuild your credit"

#### Score 580-669 (Fair)

- **Starter Financing**
  - Up to $50
  - 5% interest
  - 3-month term
  - 20% down payment required

#### Score 670-739 (Good)

- **Standard Financing**
  - Up to $200
  - 3% interest
  - 6-month term
  - 10% down payment
- **Micro Business Loan**
  - Up to $100
  - 2% interest
  - Project-based repayment
  - Requires business plan

#### Score 740-799 (Very Good)

- **Premium Financing**
  - Up to $500
  - 1% interest
  - 12-month term
  - 5% down payment
- **Business Line of Credit**
  - $200 revolving
  - 1.5% interest
  - Minimum monthly payment
- **Education Fund Match**
  - Parents match 50% of savings goal contributions
  - Must maintain 740+ score

#### Score 800+ (Excellent)

- **Elite Financing**
  - Up to $1,000
  - 0.5% interest
  - 24-month term
  - Down payment negotiable (can be 0%)
- **Venture Capital**
  - Parents fund 30% of business proposal
  - Repay from profits only
  - Revenue sharing agreement
- **No-Interest Grace Period**
  - First 3 months interest-free on any agreement

### Agreement Types

#### Purchase Financing

Traditional installment loan for a specific item (gaming PC, bike, etc.)

**Flow:**

1. Learner identifies item and cost
2. Writes justification (why needed, how they'll afford payments)
3. Submits application
4. Parent reviews credit score, payment capacity, justification
5. Parent approves with terms OR requests more info OR denies
6. On approval:
   - Parent pays full amount immediately (or sets aside)
   - Parent agency -= full purchase amount
   - Learner agency -= down payment
   - Monthly payments scheduled
7. Learner makes monthly payments from earned agency
8. Each payment reduces parent's "Learner Agency Owed"
9. Miss payment = late fee + credit score impact + item can be repossessed (teaching moment)

**Interest Calculation:** Simple interest, educational but realistic

- Monthly payment = (Principal - Down Payment) × (1 + (Rate × Months)) / Months

#### Business Loan

Funding for entrepreneurial projects (lemonade stand, bake sale, online store, etc.)

**Flow:**

1. Learner submits business plan:
   - What is the business?
   - Startup costs needed
   - Expected revenue
   - Profit projections
   - Repayment plan
2. Parent evaluates feasibility and educational value
3. On approval:
   - Parent provides capital
   - Learner receives funds
   - Repayment terms flexible based on project (can be profit-based)
4. Learner tracks business income/expenses
5. Submits monthly progress reports
6. Repays from profits OR from task earnings if business fails

**Learning Outcomes:**

- Business planning
- Profit vs. revenue
- Risk assessment
- What happens when businesses fail (sometimes you still owe money)
- Success = credit boost, failure with lessons = neutral, irresponsibility = credit hit

#### Line of Credit

Revolving credit for ongoing projects/expenses

**Flow:**

1. Available only at Good score or above
2. Learner approved for $X revolving limit
3. Can "draw" funds as needed (like a credit card)
4. Minimum monthly payment required (10% of balance or $10, whichever greater)
5. Interest accrues on outstanding balance
6. Teaches credit card mechanics in safe environment

---

## 📊 Data Model

### Core Tables

#### users

- `id` (PK)
- `email` (unique)
- `password_hash`
- `name`
- `role` (enum: 'admin', 'adult', 'learner')
- `parent_guarantor_id` (FK to users, for learners)
- `created_at`
- `updated_at`

#### income_streams

- `id` (PK)
- `user_id` (FK)
- `name` (e.g., "John's Salary")
- `amount`
- `frequency` (enum: 'weekly', 'biweekly', 'monthly', 'annual')
- `next_deposit_date`
- `is_active`

#### credit_cards

- `id` (PK)
- `name`
- `credit_limit`
- `cycle_start_day` (1-31)
- `statement_close_day` (1-31)
- `payment_due_day` (1-31)
- `is_shared_family` (boolean)
- `is_active`

#### transactions

- `id` (PK)
- `user_id` (FK)
- `card_id` (FK, nullable)
- `amount`
- `category`
- `date`
- `is_projected` (boolean - for grocery lists, future bills)
- `notes`
- `exceeded_warning` (boolean)
- `warning_explanation` (text, required if exceeded_warning)
- `created_at`

#### learner_credit_profiles

- `learner_id` (PK, FK to users)
- `current_score` (350-900)
- `score_history` (JSON array: [{date, score, reason}])
- `account_open_date`
- `total_tasks_completed`
- `total_tasks_assigned`
- `on_time_report_count`
- `late_report_count`
- `average_utilization`
- `per_cycle_spending_limit` (set by parent)

#### task_definitions

Parent-created task templates

- `id` (PK)
- `parent_id` (FK to users)
- `title`
- `description`
- `agency_value`
- `recurrence_rule` (RRULE format for iCal-like recurrence)
- `requires_photo_proof` (boolean)
- `requires_description_proof` (boolean)
- `estimated_time_minutes`
- `category`
- `is_active`

#### task_instances

Actual task assignments

- `id` (PK)
- `task_definition_id` (FK)
- `learner_id` (FK to users)
- `assigned_date`
- `due_date`
- `completed_date`
- `proof_photo_url`
- `proof_description`
- `approved_by_parent_id` (FK to users)
- `approval_date`
- `agency_awarded`
- `quality_rating` (1-5)
- `parent_feedback`
- `status` (enum: 'assigned', 'completed', 'approved', 'rejected')

#### agreements

- `id` (PK)
- `learner_id` (FK)
- `type` (enum: 'purchase_financing', 'business_loan', 'line_of_credit')
- `purpose` (what they're buying/funding)
- `principal_amount`
- `down_payment`
- `interest_rate` (decimal, e.g., 0.01 for 1%)
- `term_months`
- `monthly_payment` (calculated)
- `start_date`
- `business_plan` (text, for business loans)
- `status` (enum: 'pending', 'active', 'paid_off', 'defaulted', 'forgiven')
- `created_at`

#### agreement_payments

- `id` (PK)
- `agreement_id` (FK)
- `payment_number` (1, 2, 3...)
- `due_date`
- `amount_due`
- `amount_paid`
- `paid_date`
- `status` (enum: 'pending', 'paid', 'late', 'missed')
- `late_fee_applied`
- `days_late`

#### savings_goals

- `id` (PK)
- `name`
- `target_amount`
- `current_amount`
- `scope` (enum: 'personal', 'family')
- `owner_user_id` (FK, for personal goals)
- `is_financing` (boolean - reverse financing model)
- `monthly_auto_contribution`
- `parent_match_rate` (decimal, e.g., 0.5 for 50% match)
- `status` (enum: 'active', 'completed', 'abandoned')
- `abandonment_explanation`
- `abandonment_funds_destination`
- `created_at`

#### savings_contributions

- `id` (PK)
- `goal_id` (FK)
- `user_id` (FK)
- `amount`
- `date`
- `source` (enum: 'earned_agency', 'cash', 'parent_match')

#### credit_score_events

- `id` (PK)
- `learner_id` (FK)
- `date`
- `old_score`
- `new_score`
- `reason` (enum: many options)
- `impact_points`
- `notes`

#### payment_events

Actual payments made to credit cards

- `id` (PK)
- `card_id` (FK)
- `amount`
- `payment_date`
- `income_stream_id` (FK, which paycheck funded it)
- `cycle_identifier` (string, e.g., "2025-11")

#### notifications

- `id` (PK)
- `user_id` (FK)
- `type` (enum: many types)
- `title`
- `body`
- `is_read` (boolean)
- `action_url` (optional deep link)
- `created_at`

---

## 🎨 Key User Flows

### Adult: Enter Transaction with Warning

1. Adult navigates to "Add Expense"
2. Fills in: Amount, Category, Card, Date, Notes
3. On submit, backend calculates:
   - Current cycle spending
   - Projected expenses
   - Available backed agency
4. If transaction would exceed 85% of backed agency:
   - Modal appears: "⚠️ This brings you to 95% of backed agency"
   - Shows impact on budget categories
   - Requires explanation (text field, min 20 chars)
   - Buttons: "Cancel" | "I Understand - Submit Anyway"
5. Transaction saved with `exceeded_warning` flag and explanation

### Learner: Complete Task

1. Learner sees task board with available tasks
2. Clicks "Start Task: Clean garage ($15)"
3. Task marked as in-progress
4. When done, clicks "Submit Completion"
5. If requires proof: uploads photo and/or writes description
6. Task status → "Awaiting Approval"
7. Parent gets notification
8. Parent reviews proof, rates quality (1-5 stars), provides feedback
9. Parent clicks "Approve"
10. **IMMEDIATELY:**
    - Learner's available agency += $15
    - Parent's available agency -= $15 (added to Learner Agency Owed)
    - Notification sent to learner: "You earned $15!"
    - Credit score potentially adjusted (+2 points for completing on time)

### Learner: Apply for Agreement

1. Learner navigates to "Credit & Loans"
2. Sees their credit score and available agreement types
3. Clicks "Apply for Premium Financing"
4. Fills in application:
   - What are you purchasing? "Gaming PC"
   - How much does it cost? $850
   - Why do you need this? (min 100 words)
   - How will you make monthly payments? (describe income plan)
5. System calculates:
   - Eligible terms based on credit score (740 = Premium Financing)
   - Down payment required: $42.50 (5%)
   - Monthly payment: $67.71 × 12 months @ 1% interest
6. Shows preview: "You'll need $42.50 now, then $67.71/month"
7. Checks learner's current agency: $180 available ✓
8. Learner reviews and clicks "Submit Application"
9. **Parent Side:**
   - Notification: "Emma wants to finance a Gaming PC ($850)"
   - Parent reviews application, sees:
     - Credit score: 745 ✓
     - Down payment covered: ✓
     - Monthly payment affordable based on average earnings: ✓
     - Justification: [Emma's explanation]
   - Parent options: Approve | Request More Info | Deny
10. **On Approval:**
    - Agreement created in DB with status 'active'
    - Parent's available agency -= $850 (full amount fronted)
    - Learner's available agency -= $42.50 (down payment)
    - 12 monthly payments scheduled (auto-deduct dates set)
    - Notification sent to learner: "Your Gaming PC loan was approved! 🎉"
    - Credit score +10 (approved for credit)
11. **Each Month:**
    - System auto-deducts $67.71 from learner's earned agency
    - If insufficient funds → late payment flow (late fee, score hit)
    - Payment reduces parent's "Learner Agency Owed" by $67.71

### Learner: Generate Credit Report

1. On payment due date, learner gets prominent notification
2. Clicks "Generate Your Credit Report"
3. Sees pre-filled report:
   - Cycle dates
   - Total earned this cycle
   - Tasks completed vs. assigned (%)
   - Total spent
   - Category breakdown
   - Credit utilization percentage
   - Agreement payment status
   - Current credit score with change indicator
4. **Required Reflection Questions:**
   - "What did you learn about managing money this cycle?" (min 50 words)
   - "What will you do differently next cycle?" (min 50 words)
   - "What are you proud of?" (optional)
   - "What was challenging?" (optional)
5. Submits report → status "Pending Parent Review"
6. **Parent Side:**
   - Reviews report
   - Sees learner's reflections
   - Can add feedback/comments
   - Clicks "Approve Report"
7. **On Approval:**
   - Report marked complete
   - Credit score adjustment (+10 for on-time submission, quality bonus possible)
   - Notification to learner: "Your report was reviewed! Check out your parent's feedback."

---

## 🔔 Notification System

### Adult Notifications

**Payment Reminders:**

- 3 days before: "Payment 1 due in 3 days - $1,245.67 from John's Salary"
- Day of: "Don't forget payment 1 today!"
- 1 day after (if not marked paid): "Did you make your payment?"

**Agency Warnings:**

- At 75%: "You're at 75% of backed agency"
- At 85%: "⚠️ You're at 85% of backed agency - consider cutting back"
- At 95%: "🚨 You're at 95% of backed agency - only emergency expenses"

**Learner Activity:**

- "Emma completed 'Clean garage' - Review to approve"
- "Emma submitted a credit report - Review now"
- "Emma applied for financing - Approval needed"

### Learner Notifications

**Task Notifications:**

- "New task available: 'Take out trash' - $5"
- "Task due tomorrow: 'Vacuum living room'"
- "Task approved! You earned $15. Current balance: $142"

**Agreement Notifications:**

- "Payment due in 3 days - Make sure you have $67.71"
- "Payment successfully processed - 8 of 12 complete"
- "⚠️ Insufficient funds for payment - Earn more agency or request extension"

**Credit Score:**

- "Your credit score went up! 745 → 758 (+13)"
- "Your credit score decreased. 745 → 720 (-25). Review what happened."
- "New agreement unlocked! You now qualify for Premium Financing"

**Reports:**

- "Time to generate your credit report! Due Nov 12"
- "Your report was reviewed - check out your parent's feedback"

---

## 🛡️ Security & Privacy

### Authentication

- JWT tokens with httpOnly cookies
- Refresh token rotation
- Bcrypt password hashing (12 rounds)
- CSRF protection
- Rate limiting on login attempts (5 tries, 15-minute lockout)

### Authorization

- Role-based access control (RBAC)
- Parents can view all family data
- Adults can only view their own data
- Learners can only view their own data
- Middleware enforces permissions on every route

### Data Protection

- HTTPS only (Let's Encrypt SSL)
- SQL injection prevention (parameterized queries via Knex)
- XSS prevention (React escapes by default, Content Security Policy headers)
- Database connection pooling with SSL
- Automated daily backups with encryption at rest

### Self-Hosted Security

- No external APIs (no third-party breach risk)
- All data stays on your server
- Optional 2FA for admin/adult accounts (TOTP)
- Audit log for sensitive actions (agreement approvals, manual score adjustments)

---

## 📱 PWA Features

### Installability

- Manifest file with app icons
- Service worker for offline functionality
- Add to home screen prompt
- Full-screen mode on mobile

### Offline Capability

- Cache static assets
- Queue transactions for sync when online
- Show cached dashboard data
- "You're offline" indicator

### Push Notifications

- Web Push API integration
- User subscribes on first login
- Notifications for critical events (payment due, task approved, etc.)
- Works even when app not open

---

## 🚀 Deployment

### Docker Compose Setup

```yaml
services:
  postgres:
    image: postgres:16
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: familyfinance
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    networks:
      - backend

  api:
    build: ./backend
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgres://postgres:${DB_PASSWORD}@postgres:5432/familyfinance
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    networks:
      - backend
      - frontend

  web:
    build: ./frontend
    depends_on:
      - api
    networks:
      - frontend

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    depends_on:
      - web
      - api
    networks:
      - frontend

volumes:
  pgdata:

networks:
  frontend:
  backend:
```

### Initial Setup

```bash
# Clone repo
git clone <your-repo-url>
cd familyfinance

# Copy environment template
cp .env.example .env

# Edit with your settings
nano .env

# Generate JWT secret
openssl rand -base64 32

# Start services
docker-compose up -d

# Run migrations
docker-compose exec api npm run migrate:latest

# Create admin account
docker-compose exec api npm run seed:admin

# Setup SSL (if using domain)
docker-compose run --rm certbot certonly --webroot \
  -w /var/www/certbot \
  -d yourdomain.com
```

### Environment Variables

```bash
# Database
DB_PASSWORD=<strong-password>
DATABASE_URL=postgres://postgres:${DB_PASSWORD}@postgres:5432/familyfinance

# Auth
JWT_SECRET=<generated-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# App
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://yourdomain.com

# Email (for notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=<email-password>

# Web Push (for notifications)
VAPID_PUBLIC_KEY=<generated>
VAPID_PRIVATE_KEY=<generated>
VAPID_EMAIL=your-email@example.com
```

---

## 🧪 Development

### Local Setup

```bash
# Backend
cd backend
npm install
npm run migrate:latest
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

### Database Migrations

```bash
# Create new migration
npm run migrate:make <migration_name>

# Run migrations
npm run migrate:latest

# Rollback last migration
npm run migrate:rollback

# Reset database (DANGER)
npm run migrate:rollback --all
npm run migrate:latest
```

### Seeding Data

```bash
# Create demo family
npm run seed:demo

# This creates:
# - Admin account (admin@family.local / admin123)
# - 2 adult accounts
# - 2 learner accounts
# - Sample credit cards
# - Sample income streams
# - Sample tasks
# - Sample transactions
```

---

## 📈 Future Enhancements

### Phase 7+ Ideas

**Investment Simulator:**

- Learners can "invest" saved agency in mock index funds
- Real market data, but play money
- Learn about compound interest, risk tolerance

**Allowance Automation:**

- Auto-create recurring task instances
- Auto-approve if photo proof meets criteria (ML image recognition?)

**Spending Insights:**

- AI-powered spending analysis
- "You spend 30% more on dining out than the average family"
- Suggest budget optimizations

**Gamification:**

- Achievements/badges (first loan paid off, 6-month task streak, etc.)
- Leaderboard (family only, privacy-safe)
- Seasonal challenges

**Multi-Family Support:**

- Host multiple families on one instance
- Completely isolated data
- Family admin creates their own users

---

## 📜 License & Philosophy

This project is built for personal use with the intention of eventual open-source release.

**Why build this?**

- Existing finance apps treat kids as afterthoughts (allowance trackers are too simple)
- Credit education happens too late (after kids already have real credit cards)
- Parents want to teach financial literacy but lack tools that bridge theory and practice
- Gamification can make learning engaging without trivializing serious concepts

**What makes this different?**

- Learners experience _real_ financial mechanics (interest, credit scores, loan agreements)
- Parents maintain full oversight while giving kids meaningful autonomy
- The pain of bad financial decisions is educational, not catastrophic
- It grows with the family (start young with simple tasks, scale to complex agreements)

**Future Vision:**
If this proves valuable, release as an open-source project with:

- Easy deployment (Docker one-liner or hosted service)
- Plug-in architecture for custom task types, agreement terms
- Community-contributed educational content
- Optional paid hosting for non-technical families

---

## 🙏 Acknowledgments

Built with love for future generations who deserve better financial education than we got.

Special thanks to:

- Every parent trying to teach their kids about money
- Every kid who asked "why" when told to save
- The open-source community that made this possible

---

## 📞 Support & Contributing

**Issues:** [GitHub Issues](https://github.com/yourusername/familyfinance/issues)
**Discussions:** [GitHub Discussions](https://github.com/yourusername/familyfinance/discussions)

This is a personal project currently under active development. Once stable, contribution guidelines will be added.

**Current Status:** Pre-Alpha - Core Features In Development

---

**Remember:** This is a tool for education and habit-building. The real goal isn't perfect budgets or maximized credit scores - it's raising financially literate, responsible humans who understand that money is a tool, not a mystery.

---

## 📋 Development Roadmap

### Phase 1: Core Adult System ✅ (Weeks 1-2)

**Goal:** Functional expense tracking for adults with credit-cycle awareness

- [x] User authentication (JWT, bcrypt)
  - [x] Login/logout
  - [x] Password reset
  - [x] Session management
- [x] Multi credit card tracking
  - [x] Add/edit/archive cards
  - [x] Set cycle dates (start, statement close, due date)
  - [x] Track multiple cards with different cycles
- [x] Multi income stream tracking
  - [x] Add/edit income sources
  - [x] Set frequency (weekly, biweekly, monthly)
  - [x] Forecast upcoming deposits
- [ ] Transaction management
  - [x] Manual entry with category
  - [x] Edit/delete transactions
  - [ ] Filter by date, category, card
- [x] Agency calculation engine
  - [x] Calculate credit agency (limits - spending)
  - [x] Calculate backed agency (income - obligations)
  - [x] Display both prominently
  - [ ] Warning system (75%, 85%, 95% thresholds)
- [x] Payment cycle tracking
  - [x] Current cycle dashboard
  - [x] Days until statement close / due date
  - [x] Suggested payment amounts (two-payment strategy)
  - [ ] Mark payments as made
- [x] Basic dashboard
  - [x] Agency meters (visual indicators)
  - [x] Recent transactions
  - [x] Upcoming payments
  - [ ] Quick-add transaction

**Deliverable:** Adults can track all credit cards and income, see real-time agency, and review upcoming obligations in the authenticated frontend shell.

---

### Phase 2: Projections & Savings (Week 3)

**Goal:** Forward-looking budget management

- [ ] Projected expenses
  - [ ] Add future/planned expenses
  - [ ] Mark as actual when purchased
  - [ ] Factor into agency calculation
  - [ ] Grocery list template (common categories)
- [ ] Savings goals (adult/family only for now)
  - [ ] Create goal with target amount
  - [ ] Manual contributions
  - [ ] Progress visualization
  - [ ] Goal completion flow
  - [ ] Abandonment with explanation form
- [ ] Enhanced agency calculation
  - [ ] Factor in projected expenses
  - [ ] Factor in savings commitments
  - [ ] Show "safe to spend" vs "technically available"
- [ ] Category budgeting
  - [ ] Set monthly budget per category
  - [ ] Track spending vs. budget
  - [ ] Visual progress bars
  - [ ] Warning when approaching category limit

**Deliverable:** Adults can plan ahead, save intentionally, and see future obligations impact current agency

---

### Phase 3: Learner Foundation (Weeks 4-5)

**Goal:** Kids can earn agency through tasks and track spending

- [ ] Learner account setup
  - [ ] Create learner account (parent action)
  - [ ] Set per-cycle spending limit
  - [ ] Initial credit score: 650
  - [ ] Virtual credit profile initialization
- [ ] Credit score system
  - [ ] Score calculation algorithm
  - [ ] Score history tracking
  - [ ] Score change event logging
  - [ ] Display score with rating (Poor/Fair/Good/Very Good/Excellent)
- [ ] Task system - Parent side
  - [ ] Create task definitions (title, value, recurrence)
  - [ ] Set proof requirements (photo, description, neither)
  - [ ] Assign to specific learner(s)
  - [ ] View pending approvals
  - [ ] Approve/reject with feedback
  - [ ] Rate task quality (1-5 stars)
- [ ] Task system - Learner side
  - [ ] View available tasks
  - [ ] Claim task (marks in-progress)
  - [ ] Submit completion with proof
  - [ ] View approval status
  - [ ] See earned agency update immediately
- [ ] Learner dashboard
  - [ ] Available agency display
  - [ ] Current credit score with trend
  - [ ] Task board (available, in-progress, completed)
  - [ ] Simple spending tracker
- [ ] Learner agency impact on parents
  - [ ] Approved tasks immediately deduct from parent agency
  - [ ] "Learner Agency Owed" tracking
  - [ ] Display in parent dashboard

**Deliverable:** Kids can complete tasks, earn virtual agency, track their spending, and see their credit score. Parents can create tasks and approve work. System properly accounts for learner obligations in parent budget.

---

### Phase 4: Agreements & Financing (Weeks 6-7)

**Goal:** Full loan/credit simulation with real consequences

- [ ] Agreement eligibility system
  - [ ] Calculate available agreement types based on score
  - [ ] Display unlocked tiers
  - [ ] Show requirements for locked tiers
- [ ] Purchase financing
  - [ ] Application form (item, cost, justification)
  - [ ] Terms calculation (down payment, monthly payment, interest)
  - [ ] Parent approval interface
  - [ ] Agreement activation (parent agency deduction)
  - [ ] Monthly payment schedule
  - [ ] Auto-deduct from learner agency
  - [ ] Late payment handling (fee, score impact)
  - [ ] Early payoff option
- [ ] Business loans
  - [ ] Business plan template
  - [ ] Profit tracking
  - [ ] Flexible repayment terms
  - [ ] Success/failure flows
- [ ] Line of credit
  - [ ] Revolving balance
  - [ ] Minimum payment calculation
  - [ ] Interest accrual
  - [ ] Draw/repay interface
- [ ] Agreement dashboard (learner)
  - [ ] Active agreements list
  - [ ] Payment due dates
  - [ ] Payment history
  - [ ] Payoff progress
- [ ] Agreement management (parent)
  - [ ] Pending approval queue
  - [ ] Active agreement monitoring
  - [ ] Manual intervention (forgiveness, extension)
  - [ ] View repayment history

**Deliverable:** Kids can apply for real loans with terms, parents can approve, monthly payments auto-deduct, credit score responds to payment behavior. This is the core educational mechanic.

---

### Phase 5: Reports & Analytics (Week 8)

**Goal:** Reflection, accountability, and insights

- [ ] Learner credit reports
  - [ ] Auto-prompt on payment due dates
  - [ ] Pre-filled cycle summary
  - [ ] Required reflection questions
  - [ ] Parent review interface
  - [ ] Feedback system
  - [ ] On-time submission tracking (affects score)
- [ ] Analytics dashboard (adults)
  - [ ] Spending over time (charts)
  - [ ] Category breakdown
  - [ ] Cycle-over-cycle comparison
  - [ ] Identify spending patterns
  - [ ] Export data (CSV)
- [ ] Analytics dashboard (learners)
  - [ ] Earnings over time
  - [ ] Task completion rate
  - [ ] Credit score history chart
  - [ ] Agreement payment history
- [ ] Family overview (admin)
  - [ ] Consolidated spending
  - [ ] All learner scores at a glance
  - [ ] Pending approvals summary
  - [ ] Financial health metrics

**Deliverable:** Regular reflection builds metacognition. Parents and kids can see patterns, learn from data, and make informed decisions.

---

### Phase 6: Polish & Deploy (Weeks 9-10)

**Goal:** Production-ready, delightful to use

- [ ] PWA enhancements
  - [ ] Service worker for offline
  - [ ] App manifest
  - [ ] Install prompts
  - [ ] Offline transaction queue
- [ ] Notification system
  - [ ] Email notifications (Nodemailer)
  - [ ] Web push notifications
  - [ ] Notification preferences per user
  - [ ] Mark as read functionality
  - [ ] In-app notification center
- [ ] Mobile responsiveness
  - [ ] Touch-friendly UI
  - [ ] Bottom navigation for mobile
  - [ ] Swipe gestures where appropriate
  - [ ] Test on various devices
- [ ] Accessibility
  - [ ] ARIA labels
  - [ ] Keyboard navigation
  - [ ] Screen reader testing
  - [ ] Color contrast compliance (WCAG AA)
- [ ] Docker deployment
  - [ ] Docker Compose configuration
  - [ ] Nginx reverse proxy
  - [ ] SSL setup (Let's Encrypt)
  - [ ] Automated backups
  - [ ] Health checks
- [ ] Documentation
  - [ ] API documentation
  - [ ] Deployment guide
  - [ ] User manual
  - [ ] Troubleshooting guide
- [ ] Testing
  - [ ] Unit tests (backend logic)
  - [ ] Integration tests (API endpoints)
  - [ ] E2E tests (critical flows)
  - [ ] Load testing (family of 6-8 users)

**Deliverable:** A polished, stable, deployable application that feels professional and runs reliably on your home server.

---

## 🔧 Technical Implementation Details

### Backend Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Knex configuration
│   │   ├── auth.js              # JWT settings
│   │   └── cron.js              # Scheduled job definitions
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   ├── rbac.js              # Role-based access control
│   │   ├── errorHandler.js      # Global error handling
│   │   └── validation.js        # Request validation
│   ├── models/
│   │   ├── User.js
│   │   ├── CreditCard.js
│   │   ├── Transaction.js
│   │   ├── Task.js
│   │   ├── Agreement.js
│   │   ├── SavingsGoal.js
│   │   └── ... (more models)
│   ├── services/
│   │   ├── agencyCalculator.js  # Core agency logic
│   │   ├── creditScore.js       # Score calculation
│   │   ├── agreementTerms.js    # Loan calculations
│   │   ├── cycleManager.js      # Billing cycle logic
│   │   ├── notificationService.js
│   │   └── reportGenerator.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── transactionController.js
│   │   ├── taskController.js
│   │   ├── agreementController.js
│   │   └── ... (more controllers)
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── transactions.js
│   │   ├── tasks.js
│   │   ├── agreements.js
│   │   └── ... (more routes)
│   ├── utils/
│   │   ├── logger.js
│   │   ├── validators.js
│   │   └── helpers.js
│   └── app.js                   # Express app setup
├── migrations/                  # Database migrations
├── seeds/                       # Seed data
├── tests/
├── package.json
└── Dockerfile
```

### Frontend Structure

```
frontend/
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── service-worker.js       # Service worker
│   └── icons/                  # App icons
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Card.jsx
│   │   │   └── ... (reusable UI)
│   │   ├── dashboard/
│   │   │   ├── AgencyMeter.jsx
│   │   │   ├── CycleCountdown.jsx
│   │   │   ├── QuickStats.jsx
│   │   │   └── RecentTransactions.jsx
│   │   ├── transactions/
│   │   │   ├── TransactionList.jsx
│   │   │   ├── TransactionForm.jsx
│   │   │   └── WarningModal.jsx
│   │   ├── tasks/
│   │   │   ├── TaskBoard.jsx
│   │   │   ├── TaskCard.jsx
│   │   │   ├── TaskForm.jsx
│   │   │   └── ApprovalQueue.jsx
│   │   ├── agreements/
│   │   │   ├── AgreementList.jsx
│   │   │   ├── AgreementApplication.jsx
│   │   │   ├── AgreementApproval.jsx
│   │   │   └── PaymentSchedule.jsx
│   │   ├── savings/
│   │   │   ├── GoalCard.jsx
│   │   │   ├── GoalForm.jsx
│   │   │   └── ContributionHistory.jsx
│   │   └── learner/
│   │       ├── CreditScoreDisplay.jsx
│   │       ├── ReportGenerator.jsx
│   │       └── UnlockedAgreements.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Transactions.jsx
│   │   ├── Tasks.jsx
│   │   ├── Agreements.jsx
│   │   ├── SavingsGoals.jsx
│   │   ├── Analytics.jsx
│   │   ├── Settings.jsx
│   │   └── Login.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useAgency.js
│   │   ├── useTasks.js
│   │   ├── useAgreements.js
│   │   └── useNotifications.js
│   ├── services/
│   │   └── api.js              # API client (axios/fetch)
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── NotificationContext.jsx
│   ├── utils/
│   │   ├── formatters.js       # Date, currency formatting
│   │   ├── validators.js
│   │   └── calculations.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
└── Dockerfile
```

### Key Algorithms

#### Agency Calculator Service

```javascript
// backend/src/services/agencyCalculator.js

class AgencyCalculator {
  /**
   * Calculate available agency for an adult user
   * Returns both credit agency and backed agency
   */
  async calculateAdultAgency(userId) {
    // Get all credit cards for user
    const cards = await CreditCard.findByUser(userId);

    // Get current cycle transactions
    const transactions = await Transaction.getCurrentCycleTransactions(userId);

    // Get projected expenses
    const projected = await Transaction.getProjectedExpenses(userId);

    // Get income streams
    const income = await IncomeStream.findByUser(userId);

    // Get savings commitments
    const savingsCommitments = await SavingsGoal.getMonthlyCommitments(userId);

    // Get learner agency owed
    const learnerOwed = await this.calculateLearnerAgencyOwed(userId);

    // Calculate credit agency
    const totalCreditLimit = cards.reduce(
      (sum, card) => sum + card.credit_limit,
      0
    );
    const currentSpending = transactions
      .filter((t) => !t.is_projected)
      .reduce((sum, t) => sum + t.amount, 0);
    const projectedSpending = projected.reduce((sum, t) => sum + t.amount, 0);
    const safetyBuffer = totalCreditLimit * 0.1; // 10% buffer

    const creditAgency =
      totalCreditLimit - currentSpending - projectedSpending - safetyBuffer;

    // Calculate backed agency
    const upcomingIncome = this.calculateUpcomingIncome(income);

    const backedAgency = upcomingIncome - savingsCommitments - learnerOwed;

    return {
      creditAgency: Math.max(0, creditAgency),
      backedAgency: Math.max(0, backedAgency),
      availableAgency: Math.min(creditAgency, backedAgency),
      totalCreditLimit,
      currentSpending,
      projectedSpending,
      upcomingIncome,
      savingsCommitments,
      learnerOwed,
      utilizationPercent: (currentSpending / totalCreditLimit) * 100,
    };
  }

  /**
   * Calculate total owed to learners
   * This is money parents must account for in their budget
   */
  async calculateLearnerAgencyOwed(parentId) {
    // Get all learner children
    const learners = await User.findLearnersByParent(parentId);

    let totalOwed = 0;

    for (const learner of learners) {
      // Approved tasks not yet paid out
      const approvedTasks = await Task.getApprovedUnpaid(learner.id);
      const taskOwed = approvedTasks.reduce(
        (sum, t) => sum + t.agency_awarded,
        0
      );

      // Active agreements - parent fronted full amount, minus payments learner has made
      const agreements = await Agreement.getActive(learner.id);
      for (const agreement of agreements) {
        // Parent paid: principal amount
        // Minus: payments learner has already made back
        const payments = await AgreementPayment.getPaidByAgreement(
          agreement.id
        );
        const paidBack = payments.reduce((sum, p) => sum + p.amount_paid, 0);
        totalOwed += agreement.principal_amount - paidBack;
      }

      totalOwed += taskOwed;
    }

    return totalOwed;
  }

  /**
   * Calculate expected income before next payment due date
   */
  calculateUpcomingIncome(incomeStreams) {
    const now = new Date();
    const nextPaymentDue = this.getNextPaymentDueDate(); // 21 days from statement close typically

    let upcomingIncome = 0;

    for (const stream of incomeStreams) {
      // Count deposits that will occur between now and payment due
      const depositsCount = this.countDepositsBetween(
        stream.frequency,
        stream.next_deposit_date,
        now,
        nextPaymentDue
      );

      upcomingIncome += stream.amount * depositsCount;
    }

    return upcomingIncome;
  }

  /**
   * Calculate available agency for a learner
   */
  async calculateLearnerAgency(learnerId) {
    const profile = await LearnerCreditProfile.findByLearnerId(learnerId);

    // Get earned agency from approved tasks
    const approvedTasks = await Task.getApprovedUnpaid(learnerId);
    const earnedAgency = approvedTasks.reduce(
      (sum, t) => sum + t.agency_awarded,
      0
    );

    // Get current cycle spending
    const transactions =
      await Transaction.getCurrentCycleTransactions(learnerId);
    const currentSpending = transactions.reduce((sum, t) => sum + t.amount, 0);

    // Get upcoming agreement payments
    const upcomingPayments = await AgreementPayment.getUpcoming(learnerId);
    const paymentObligations = upcomingPayments.reduce(
      (sum, p) => sum + p.amount_due,
      0
    );

    // Get savings commitments
    const savingsCommitments =
      await SavingsGoal.getLearnerCommitments(learnerId);

    const availableAgency =
      earnedAgency - currentSpending - paymentObligations - savingsCommitments;

    return {
      earnedAgency,
      currentSpending,
      availableAgency: Math.max(0, availableAgency),
      paymentObligations,
      savingsCommitments,
      perCycleLimit: profile.per_cycle_spending_limit,
      utilizationPercent:
        (currentSpending / profile.per_cycle_spending_limit) * 100,
    };
  }
}

module.exports = new AgencyCalculator();
```

#### Credit Score Calculator Service

```javascript
// backend/src/services/creditScore.js

class CreditScoreCalculator {
  /**
   * Calculate a learner's credit score based on behavior
   * Score range: 350-900 (Canadian system)
   */
  async calculateScore(learnerId) {
    const profile = await LearnerCreditProfile.findByLearnerId(learnerId);

    let score = 650; // Base score

    // 1. Payment History (35% weight, +/- 175 points max)
    const paymentScore = await this.calculatePaymentHistoryScore(learnerId);
    score += paymentScore;

    // 2. Credit Utilization (30% weight, +/- 150 points max)
    const utilizationScore = await this.calculateUtilizationScore(learnerId);
    score += utilizationScore;

    // 3. Length of Credit History (15% weight, +/- 75 points max)
    const historyScore = this.calculateHistoryLengthScore(
      profile.account_open_date
    );
    score += historyScore;

    // 4. Task Completion Rate (10% weight, +/- 50 points max)
    const taskScore = this.calculateTaskScore(profile);
    score += taskScore;

    // 5. Parental Feedback (10% weight, +/- 50 points max)
    const feedbackScore = await this.calculateFeedbackScore(learnerId);
    score += feedbackScore;

    // 6. Manual adjustments from parent
    const manualAdjustments =
      await CreditScoreEvent.getManualAdjustments(learnerId);
    const manualTotal = manualAdjustments.reduce(
      (sum, e) => sum + e.impact_points,
      0
    );
    score += manualTotal;

    // Clamp to valid range
    score = Math.max(350, Math.min(900, Math.round(score)));

    return score;
  }

  async calculatePaymentHistoryScore(learnerId) {
    // Get credit reports submitted
    const reports = await CreditReport.findByLearner(learnerId);

    if (reports.length === 0) return 0; // Neutral for new accounts

    const onTimeCount = reports.filter((r) => r.submitted_on_time).length;
    const totalCount = reports.length;
    const onTimeRate = onTimeCount / totalCount;

    // 100% on-time = +175, 75% = 0 (neutral), <75% = negative
    const score = ((onTimeRate - 0.75) / 0.25) * 175;

    // Also factor in agreement payments
    const agreementPayments = await AgreementPayment.findByLearner(learnerId);
    if (agreementPayments.length > 0) {
      const paidOnTime = agreementPayments.filter(
        (p) => p.status === 'paid' && p.days_late === 0
      ).length;
      const agreementOnTimeRate = paidOnTime / agreementPayments.length;

      // Weight reports 60%, agreements 40%
      const combinedScore =
        score * 0.6 + ((agreementOnTimeRate - 0.75) / 0.25) * 175 * 0.4;
      return Math.max(-175, Math.min(175, combinedScore));
    }

    return Math.max(-175, Math.min(175, score));
  }

  async calculateUtilizationScore(learnerId) {
    const profile = await LearnerCreditProfile.findByLearnerId(learnerId);
    const agency = await AgencyCalculator.calculateLearnerAgency(learnerId);

    const utilizationPercent = agency.utilizationPercent / 100;

    // <30% utilization = excellent (+150)
    // 30-50% = good (+75)
    // 50-70% = neutral (0)
    // >70% = poor (negative, worsens exponentially)

    if (utilizationPercent < 0.3) return 150;
    if (utilizationPercent < 0.5) return 75;
    if (utilizationPercent < 0.7) return 0;

    // Above 70%, score drops quickly
    const excessUtilization = utilizationPercent - 0.7;
    return Math.max(-150, -(excessUtilization * 500));
  }

  calculateHistoryLengthScore(accountOpenDate) {
    const now = new Date();
    const daysSinceOpen =
      (now - new Date(accountOpenDate)) / (1000 * 60 * 60 * 24);
    const yearsSinceOpen = daysSinceOpen / 365;

    // Max out at 5 years = +75 points
    // Linear growth: +15 points per year
    return Math.min(75, yearsSinceOpen * 15);
  }

  calculateTaskScore(profile) {
    if (profile.total_tasks_assigned === 0) return 0; // Neutral for new accounts

    const completionRate =
      profile.total_tasks_completed / profile.total_tasks_assigned;

    // 80% completion = neutral (0)
    // 100% = +50
    // <80% = negative
    return ((completionRate - 0.8) / 0.2) * 50;
  }

  async calculateFeedbackScore(learnerId) {
    const tasks = await Task.findCompletedByLearner(learnerId);

    if (tasks.length === 0) return 0;

    const totalRating = tasks.reduce(
      (sum, t) => sum + (t.quality_rating || 3),
      0
    );
    const avgRating = totalRating / tasks.length;

    // 3/5 stars = neutral (0)
    // 5/5 = +50
    // 1/5 = -50
    return ((avgRating - 3) / 2) * 50;
  }

  /**
   * Log a score change event
   */
  async logScoreChange(learnerId, oldScore, newScore, reason, notes = null) {
    await CreditScoreEvent.create({
      learner_id: learnerId,
      date: new Date(),
      old_score: oldScore,
      new_score: newScore,
      reason,
      impact_points: newScore - oldScore,
      notes,
    });
  }
}

module.exports = new CreditScoreCalculator();
```

---

## 🎨 UI/UX Design Principles

### For Adults: Information Density

Adults want to see the numbers. Don't hide information behind clicks.

**Dashboard principles:**

- Show agency prominently with both credit and backed values
- Use color coding: Green (>50% agency), Yellow (25-50%), Red (<25%)
- Display cycle countdown at all times
- Recent transactions visible without scrolling
- Quick-add transaction always accessible (floating button or top bar)

**Transaction entry:**

- Form should be fast: amount, category dropdown, date (defaults to today), optional notes
- Show impact on agency in real-time as they type amount
- Warning modal only triggers if threshold breached
- Don't make them confirm routine entries

### For Learners: Engaging & Educational

Kids need visual feedback and gamification, but not patronizing.

**Dashboard principles:**

- Big, bold numbers for available agency
- Credit score displayed prominently with badge (Poor/Fair/Good/Very Good/Excellent)
- Task board should feel like quest log (game design inspiration)
- Progress bars for everything (agreements, savings goals, cycle utilization)
- Celebrate wins (confetti animation when loan paid off, level-up sound for score increase)

**Color psychology:**

- Green: Positive (earned money, good score, paid on time)
- Blue: Informational (neutral facts, upcoming events)
- Yellow/Orange: Warning (approaching limit, task due soon)
- Red: Urgent (missed payment, overdrawn, score drop)
- Purple: Achievement (goals completed, high score tier)

### Accessibility Requirements

- All interactive elements minimum 44×44px touch target
- Color never the only indicator (use icons + text)
- Font size minimum 16px (prevents iOS zoom on input)
- High contrast text (WCAG AA compliant)
- Screen reader labels on all form fields
- Keyboard navigation support (tab order logical)

---

## 🔐 Data Privacy & Ethics

### What We Track

- Financial transactions (amounts, categories, dates)
- Task completion and work quality
- Credit scores and history
- Loan agreements and payments
- User behavior (login times, feature usage - for improving UX only)

### What We DON'T Track

- Browsing history
- Location data (beyond timezone for date calculations)
- Biometric data
- Third-party integrations (no selling data, no ads, no analytics services)

### Data Ownership

- Parents own all family data
- Data export available anytime (JSON, CSV)
- Account deletion removes all PII permanently
- Logs retained for 90 days (security purposes)

### Ethical Considerations

**For Learners:**

- System is educational, not punitive
- Scores and penalties are learning opportunities, not permanent records
- Parents can forgive loans/adjust scores with explanation
- Real financial decisions (by parents) are never automated based on learner behavior
- Privacy from siblings (learners can't see each other's full data, only leaderboard if enabled)

**For Parents:**

- Tool assists decision-making, never replaces parenting judgment
- Override mechanisms exist for all automated actions
- Transparency: kids can see why their score changed
- Not a surveillance tool: respect kids' agency and privacy

---

## 🐛 Known Limitations & Future Considerations

### Current Limitations

- Single family per deployment (multi-tenancy planned for Phase 7+)
- Canadian financial system only (USD/other regions could be added)
- Manual transaction entry only (no bank API integrations by design)
- English only (i18n planned but not prioritized)
- No mobile apps (PWA only - may build native later if demand)

### Deliberate Design Choices

- **No gamification of spending:** We don't reward spending more, only managing well
- **No social features:** This is family-private by design
- **No external integrations:** Keeps it simple, secure, and privacy-focused
- **No "AI advisor":** Financial decisions should be human, not algorithmic

### Edge Cases to Handle

- What if learner earns more than parent can pay? (Cap task approvals or delay payouts)
- What if kid wants to cancel an agreement? (Penalty fee, score hit, educational discussion)
- What if parent forgets to approve tasks for weeks? (Auto-reminder, eventual auto-approval with notice)
- What if there's a dispute? (Audit log shows all actions, parent has final say but can't hide history)

---

## 📚 Educational Resources (Bundled Content Ideas)

### For Parents (Help Section)

- "How to set appropriate spending limits for different ages"
- "When to approve vs. deny loan applications"
- "Teaching compound interest through savings goals"
- "Having the 'credit score' conversation"
- "What to do when they miss a payment (teachable moments)"

### For Learners (Interactive Modules)

- "What is credit and why does it matter?"
- "Interest: How it works and why it costs you"
- "Building a budget that actually works"
- "Business basics: Revenue vs. Profit"
- "The power of compound growth (savings goals)"

### Quiz / Certification System (Optional)

- Before unlocking high-tier agreements, require passing a financial literacy quiz
- "Loan Basics Certification" - must score 80%+ to apply for Elite Financing
- Parents can require certifications for any tier

---

## 🧮 Financial Calculations Reference

### Interest & Amortization

**Simple Interest (Used for Learner Agreements):**

```
Total Interest = Principal × Rate × Time
Monthly Payment = (Principal + Total Interest) / Number of Months

Example: $850 PC, 1% annual rate, 12 months
Total Interest = $850 × 0.01 × 1 = $8.50
Total Repayment = $850 + $8.50 = $858.50
Monthly Payment = $858.50 / 12 = $71.54
```

**Why simple interest?**
Educational simplicity. Kids can understand "I borrowed $850, I'll pay back $858.50, that's $8.50 extra for borrowing."

**Compound Interest (Used for Savings Goals):**

```
Future Value = Principal × (1 + Rate)^Time

Example: $100 saved monthly at 2% annual (compounded monthly)
After 2 years = significant educational impact demonstration
```

### Credit Utilization

```
Utilization % = (Current Spending / Credit Limit) × 100

Optimal: < 30%
Acceptable: 30-50%
Concerning: 50-70%
Harmful: > 70%
```

### Debt-to-Income Ratio (Adult Agency)

```
DTI = (Monthly Debt Obligations / Monthly Income) × 100

Healthy: < 36%
Manageable: 36-43%
Stressed: 43-50%
Unsustainable: > 50%
```

---

## 🚦 Business Logic Rules

### Transaction Warning Thresholds

**Adult Transactions:**

- **75% backed agency** = Yellow indicator, no interruption
- **85% backed agency** = Orange warning tooltip on submit
- **95% backed agency** = Red modal with required explanation
- **>100% backed agency** = Hard block, must adjust projected expenses or add income

**Learner Transactions:**

- **75% cycle limit** = Yellow indicator
- **90% cycle limit** = Orange warning, suggest saving
- **100% cycle limit** = Soft block, requires parent approval to exceed (teaching moment)
- **Attempting to spend without earned agency** = Hard block with educational message

### Credit Score Change Triggers

**Automatic Score Changes:**

- Report submitted on time: +10 points
- Report submitted 1-3 days late: -5 points
- Report submitted 4-7 days late: -15 points
- Report submitted >7 days late: -30 points
- Agreement payment on time: +5 points
- Agreement payment 1-7 days late: -20 points, $5 late fee
- Agreement payment >7 days late: -40 points, $10 late fee
- Agreement paid off early: +30 points
- Agreement paid off on schedule: +20 points
- Task completion streak (7 in a row): +10 points
- High utilization (>80%) at cycle end: -15 points
- Low utilization (<20%) at cycle end: +10 points

**Manual Adjustments (Parent):**

- Exceptional work: +5 to +25 points
- Irresponsible behavior: -5 to -25 points
- Must include reason (logged and visible to learner)

### Agreement Approval Logic

```javascript
function canApproveAgreement(learner, agreement) {
  const checks = [];

  // 1. Credit score sufficient for agreement type
  const eligible = getEligibleAgreementTypes(learner.credit_score);
  checks.push({
    name: 'Credit Score',
    pass: eligible.includes(agreement.type),
    message: `Score ${learner.credit_score} ${eligible.includes(agreement.type) ? 'qualifies' : 'does not qualify'}`,
  });

  // 2. Down payment covered by current agency
  checks.push({
    name: 'Down Payment',
    pass: learner.available_agency >= agreement.down_payment,
    message: `Has ${learner.available_agency}, needs ${agreement.down_payment}`,
  });

  // 3. Monthly payment affordable (based on average earnings)
  const avgMonthlyEarnings = calculateAverageMonthlyEarnings(learner.id);
  const affordabilityRatio = agreement.monthly_payment / avgMonthlyEarnings;
  checks.push({
    name: 'Payment Affordability',
    pass: affordabilityRatio <= 0.5, // Don't let payment exceed 50% of typical earnings
    message: `Payment is ${(affordabilityRatio * 100).toFixed(0)}% of average earnings`,
  });

  // 4. No existing defaulted agreements
  const hasDefaults = hasDefaultedAgreements(learner.id);
  checks.push({
    name: 'Payment History',
    pass: !hasDefaults,
    message: hasDefaults ? 'Has defaulted agreements' : 'Clean payment history',
  });

  return {
    canApprove: checks.every((c) => c.pass),
    checks,
  };
}
```

### Task Approval Logic

```javascript
function shouldAutoApprove(task) {
  // Auto-approve if:
  // 1. Task has no proof requirements, OR
  // 2. Task is under $10 AND learner has 95%+ completion rate AND 750+ score

  const profile = getLearnerProfile(task.learner_id);

  if (!task.requires_photo_proof && !task.requires_description_proof) {
    return { autoApprove: true, reason: 'No proof required' };
  }

  if (
    task.agency_value <= 10 &&
    profile.completion_rate >= 0.95 &&
    profile.current_score >= 750
  ) {
    return { autoApprove: true, reason: 'Trusted learner, low-value task' };
  }

  return { autoApprove: false, reason: 'Manual review required' };
}
```

### Savings Goal Abandonment

```javascript
function handleGoalAbandonment(goal, explanation) {
  // Require explanation if goal was >25% funded
  if (goal.current_amount / goal.target_amount > 0.25 && !explanation) {
    throw new Error('Explanation required for abandoning a funded goal');
  }

  // Present options for funds:
  const options = [
    {
      id: 'refund',
      label: 'Return to available agency',
      description: 'Money becomes available to spend again',
    },
    {
      id: 'transfer',
      label: 'Transfer to another goal',
      description: 'Move savings to a different goal',
    },
    {
      id: 'donate',
      label: 'Donate to family fund',
      description: 'Contribute to family savings or another family goal',
    },
  ];

  return options;
}
```

---

## 📊 Database Indexes (Performance Optimization)

```sql
-- Critical indexes for common queries

-- Users
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_parent ON users(parent_guarantor_id);

-- Transactions (most queried table)
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_card ON transactions(card_id);
CREATE INDEX idx_transactions_cycle ON transactions(user_id, date) WHERE is_projected = false;

-- Tasks
CREATE INDEX idx_task_instances_learner_status ON task_instances(learner_id, status);
CREATE INDEX idx_task_instances_pending ON task_instances(status, assigned_date) WHERE status = 'completed';

-- Agreements
CREATE INDEX idx_agreements_learner_status ON agreements(learner_id, status);
CREATE INDEX idx_agreements_active ON agreements(learner_id) WHERE status = 'active';

-- Agreement Payments
CREATE INDEX idx_payments_due ON agreement_payments(learner_id, due_date) WHERE status = 'pending';

-- Savings Contributions
CREATE INDEX idx_contributions_goal ON savings_contributions(goal_id, date DESC);

-- Credit Score Events
CREATE INDEX idx_score_events_learner_date ON credit_score_events(learner_id, date DESC);

-- Notifications
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
```

---

## 🔄 Scheduled Jobs (Cron)

### Daily Jobs

**midnight (00:00):**

```javascript
// Check for due reports
async function checkDueReports() {
  const learners = await User.findAllLearners();

  for (const learner of learners) {
    const lastReport = await CreditReport.getLatest(learner.id);
    const cycleEndDate = calculateCycleEnd();

    if (isToday(cycleEndDate) && !lastReport?.submitted) {
      // Send notification
      await Notification.create({
        user_id: learner.id,
        type: 'report_due',
        title: 'Credit Report Due Today',
        body: 'Time to generate your credit report for this cycle!',
      });
    }
  }
}

// Check for overdue reports (score penalty)
async function penalizeOverdueReports() {
  const overdueReports = await CreditReport.findOverdue();

  for (const report of overdueReports) {
    const daysOverdue = calculateDaysOverdue(report.due_date);
    let penalty = 0;

    if (daysOverdue <= 3) penalty = -5;
    else if (daysOverdue <= 7) penalty = -15;
    else penalty = -30;

    await CreditScoreCalculator.adjustScore(
      report.learner_id,
      penalty,
      'late_report',
      `Report ${daysOverdue} days overdue`
    );
  }
}

// Auto-deduct agreement payments
async function processAgreementPayments() {
  const duePayments = await AgreementPayment.getDueToday();

  for (const payment of duePayments) {
    const learner = await AgencyCalculator.calculateLearnerAgency(
      payment.learner_id
    );

    if (learner.availableAgency >= payment.amount_due) {
      // Sufficient funds
      await AgreementPayment.markPaid(payment.id, payment.amount_due);
      await CreditScoreCalculator.adjustScore(
        payment.learner_id,
        +5,
        'on_time_payment',
        `Agreement payment #${payment.payment_number} paid on time`
      );

      // Reduce parent's "Learner Agency Owed"
      await ParentLedger.reduceOwed(payment.learner_id, payment.amount_due);
    } else {
      // Insufficient funds - late payment
      await AgreementPayment.markLate(payment.id);
      await CreditScoreCalculator.adjustScore(
        payment.learner_id,
        -20,
        'missed_payment',
        `Insufficient funds for payment #${payment.payment_number}`
      );

      // Notify learner and parent
      await Notification.create({
        user_id: payment.learner_id,
        type: 'payment_missed',
        title: '⚠️ Payment Missed',
        body: `You didn't have enough agency for your ${payment.amount_due} payment. Late fee applied.`,
      });
    }
  }
}
```

**08:00 AM:**

```javascript
// Morning reminders
async function sendMorningReminders() {
  // Payment due in 3 days
  const upcomingPayments = await CreditCard.getPaymentsDueIn(3);
  for (const payment of upcomingPayments) {
    await Notification.create({
      user_id: payment.user_id,
      type: 'payment_reminder',
      title: 'Payment Due Soon',
      body: `Credit card payment of ${payment.amount} due in 3 days`,
    });
  }

  // Tasks due soon
  const dueTasks = await Task.getDueSoon(24); // Next 24 hours
  for (const task of dueTasks) {
    await Notification.create({
      user_id: task.learner_id,
      type: 'task_due',
      title: 'Task Due Soon',
      body: `"${task.title}" is due in ${task.hours_remaining} hours!`,
    });
  }
}
```

### Weekly Jobs

**Sunday 20:00 (Week Planning):**

```javascript
async function weeklyDigest() {
  const families = await User.findAllAdmins();

  for (const admin of families) {
    const stats = await generateWeeklyStats(admin.id);

    // Email digest
    await Email.send({
      to: admin.email,
      subject: 'Your Family Finance Weekly Digest',
      template: 'weekly_digest',
      data: {
        totalSpending: stats.totalSpending,
        topCategories: stats.topCategories,
        learnerHighlights: stats.learnerHighlights,
        upcomingPayments: stats.upcomingPayments,
        savingsProgress: stats.savingsProgress,
      },
    });
  }
}
```

### Monthly Jobs

**1st of month, 01:00:**

```javascript
async function monthlyRollover() {
  // Recalculate all credit scores
  const learners = await User.findAllLearners();
  for (const learner of learners) {
    const newScore = await CreditScoreCalculator.calculateScore(learner.id);
    const oldScore = learner.credit_profile.current_score;

    if (newScore !== oldScore) {
      await CreditScoreCalculator.updateScore(learner.id, newScore);
      await CreditScoreCalculator.logScoreChange(
        learner.id,
        oldScore,
        newScore,
        'monthly_recalculation',
        'Automatic monthly score recalculation'
      );
    }
  }

  // Archive last month's data
  await ArchiveService.archivePreviousMonth();
}
```

---

## 🧪 Testing Strategy

### Unit Tests (Backend)

**Core Services:**

```javascript
// tests/services/agencyCalculator.test.js
describe('AgencyCalculator', () => {
  describe('calculateAdultAgency', () => {
    it('should calculate credit agency correctly', async () => {
      // Setup: User with $10k credit limit, $3k spent
      const userId = await createTestUser({ creditLimit: 10000 });
      await createTestTransaction({ userId, amount: 3000 });

      const result = await AgencyCalculator.calculateAdultAgency(userId);

      // Expected: 10000 - 3000 - 1000 (10% buffer) = 6000
      expect(result.creditAgency).toBe(6000);
    });

    it('should account for learner agency owed', async () => {
      const parentId = await createTestUser();
      const learnerId = await createTestLearner({ parentId });
      await approveTestTask({ learnerId, amount: 50 });

      const result = await AgencyCalculator.calculateAdultAgency(parentId);

      expect(result.learnerOwed).toBe(50);
      expect(result.backedAgency).toBeLessThanOrEqual(
        result.upcomingIncome - 50
      );
    });
  });
});

// tests/services/creditScore.test.js
describe('CreditScoreCalculator', () => {
  describe('calculateScore', () => {
    it('should start new learners at 650', async () => {
      const learnerId = await createTestLearner();
      const score = await CreditScoreCalculator.calculateScore(learnerId);
      expect(score).toBe(650);
    });

    it('should increase score for on-time reports', async () => {
      const learnerId = await createTestLearner();
      await submitTestReport({ learnerId, onTime: true });

      const score = await CreditScoreCalculator.calculateScore(learnerId);
      expect(score).toBeGreaterThan(650);
    });

    it('should decrease score for high utilization', async () => {
      const learnerId = await createTestLearner({ cycleLimit: 100 });
      await createTestTransaction({ userId: learnerId, amount: 85 }); // 85% utilization

      const score = await CreditScoreCalculator.calculateScore(learnerId);
      expect(score).toBeLessThan(650);
    });
  });
});
```

### Integration Tests (API)

```javascript
// tests/integration/agreements.test.js
describe('POST /api/agreements/apply', () => {
  it('should reject application if credit score too low', async () => {
    const learner = await createTestLearner({ score: 550 });
    const token = generateTestToken(learner);

    const response = await request(app)
      .post('/api/agreements/apply')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'premium_financing',
        amount: 500,
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('credit score');
  });

  it('should create pending agreement if eligible', async () => {
    const learner = await createTestLearner({ score: 750, agency: 200 });
    const token = generateTestToken(learner);

    const response = await request(app)
      .post('/api/agreements/apply')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'premium_financing',
        amount: 500,
        purpose: 'Gaming PC',
        justification:
          'I need this for video editing and school projects. I will make payments from my weekly task earnings.',
      });

    expect(response.status).toBe(201);
    expect(response.body.agreement.status).toBe('pending');
  });
});
```

### E2E Tests (Critical User Flows)

```javascript
// tests/e2e/learner-task-flow.test.js
describe('Learner Task Flow', () => {
  it('should complete full task lifecycle', async () => {
    // 1. Parent creates task
    const parent = await loginAsParent();
    await parent.createTask({
      title: 'Clean garage',
      value: 15,
      requiresPhoto: true,
    });

    // 2. Learner sees task
    const learner = await loginAsLearner();
    const tasks = await learner.getAvailableTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Clean garage');

    // 3. Learner completes task
    await learner.completeTask(tasks[0].id, {
      photo: 'base64encodedimage',
    });

    // 4. Parent approves
    const pendingApprovals = await parent.getPendingApprovals();
    expect(pendingApprovals).toHaveLength(1);
    await parent.approveTask(pendingApprovals[0].id, {
      rating: 5,
      feedback: 'Great job!',
    });

    // 5. Learner receives agency
    const agency = await learner.getAvailableAgency();
    expect(agency.earnedAgency).toBe(15);

    // 6. Parent agency reduced
    const parentAgency = await parent.getAvailableAgency();
    expect(parentAgency.learnerOwed).toBe(15);
  });
});
```

### Load Testing

```javascript
// tests/load/concurrent-users.test.js
// Simulate family of 6 using app simultaneously
describe('Concurrent Usage', () => {
  it('should handle family of 6 without performance degradation', async () => {
    const users = await createTestFamily(6); // 2 adults, 4 learners

    const promises = users.map(user =>
      simulateTypicalUsage(user, duration: 60000) // 1 minute of activity
    );

    const startTime = Date.now();
    await Promise.all(promises);
    const endTime = Date.now();

    // Average response time should be <500ms
    const avgResponseTime = (endTime - startTime) / promises.length;
    expect(avgResponseTime).toBeLessThan(500);
  });
});
```

---

## 📖 API Documentation (OpenAPI/Swagger)

### Authentication Endpoints

**POST /api/auth/login**

```json
Request:
{
  "email": "parent@family.local",
  "password": "securepassword"
}

Response (200):
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "role": "admin",
    "email": "parent@family.local"
  },
  "token": "jwt-token-here",
  "refreshToken": "refresh-token-here"
}
```

**POST /api/auth/refresh**

```json
Request:
{
  "refreshToken": "refresh-token-here"
}

Response (200):
{
  "token": "new-jwt-token"
}
```

### Agency Endpoints

**GET /api/agency/current**

```json
Response (200):
{
  "creditAgency": 5430.50,
  "backedAgency": 4200.00,
  "availableAgency": 4200.00,
  "totalCreditLimit": 10000.00,
  "currentSpending": 3569.50,
  "projectedSpending": 450.00,
  "upcomingIncome": 6000.00,
  "savingsCommitments": 800.00,
  "learnerOwed": 1000.00,
  "utilizationPercent": 35.70,
  "warning Level": "green"
}
```

### Transaction Endpoints

**POST /api/transactions**

```json
Request:
{
  "amount": 125.50,
  "category": "groceries",
  "cardId": "uuid",
  "date": "2025-11-10",
  "notes": "Weekly grocery shop",
  "isProjected": false
}

Response (201):
{
  "transaction": {
    "id": "uuid",
    "amount": 125.50,
    "category": "groceries",
    "date": "2025-11-10",
    "warning": {
      "triggered": true,
      "level": "yellow",
      "message": "This brings you to 82% of backed agency"
    }
  },
  "updatedAgency": {
    "availableAgency": 4074.50
  }
}
```

### Task Endpoints

**GET /api/tasks/available** (Learner)

```json
Response (200):
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Take out trash",
      "description": "Roll bins to curb on Tuesday night",
      "agencyValue": 5.00,
      "requiresPhotoProof": true,
      "dueDate": "2025-11-12",
      "estimatedMinutes": 10
    }
  ]
}
```

**POST /api/tasks/:id/complete** (Learner)

```json
Request:
{
  "proofPhoto": "base64-encoded-image",
  "proofDescription": "Bins are at the curb, ready for Wednesday pickup"
}

Response (200):
{
  "task": {
    "id": "uuid",
    "status": "completed",
    "completedDate": "2025-11-10T20:15:00Z"
  },
  "message": "Task submitted for approval"
}
```

**POST /api/tasks/:id/approve** (Parent)

```json
Request:
{
  "qualityRating": 5,
  "feedback": "Great job, very thorough!",
  "agencyAwarded": 5.00
}

Response (200):
{
  "task": {
    "id": "uuid",
    "status": "approved",
    "agencyAwarded": 5.00
  },
  "learnerAgency": {
    "newBalance": 142.00
  },
  "parentAgency": {
    "learnerOwedIncrease": 5.00
  },
  "creditScoreImpact": {
    "oldScore": 745,
    "newScore": 747,
    "change": +2,
    "reason": "Task completed on time"
  }
}
```

### Agreement Endpoints

**GET /api/agreements/eligible** (Learner)

```json
Response (200):
{
  "currentScore": 745,
  "scoreRating": "Very Good",
  "eligibleAgreements": [
    {
      "type": "premium_financing",
      "maxAmount": 500.00,
      "interestRate": 0.01,
      "maxTerm": 12,
      "minDownPayment": 0.05
    },
    {
      "type": "business_loan",
      "maxAmount": 200.00,
      "interestRate": 0.02
    }
  ],
  "lockedAgreements": [
    {
      "type": "elite_financing",
      "requiredScore": 800,
      "pointsNeeded": 55
    }
  ]
}
```

**POST /api/agreements/apply** (Learner)

```json
Request:
{
  "type": "premium_financing",
  "amount": 850.00,
  "purpose": "Gaming PC",
  "justification": "I want to learn video editing and game development. This PC will let me run Unity and Premiere Pro for school projects and creative work.",
  "termMonths": 12
}

Response (201):
{
  "agreement": {
    "id": "uuid",
    "type": "premium_financing",
    "amount": 850.00,
    "downPayment": 42.50,
    "monthlyPayment": 67.71,
    "interestRate": 0.01,
    "termMonths": 12,
    "status": "pending"
  },
  "message": "Application submitted for parent approval"
}
```

**POST /api/agreements/:id/approve** (Parent)

```json
Request:
{
  "approved": true,
  "notes": "This is a good investment in your skills. Make sure you keep up with the payments!"
}

Response (200):
{
  "agreement": {
    "id": "uuid",
    "status": "active",
    "startDate": "2025-11-10",
    "firstPaymentDue": "2025-12-10"
  },
  "parentAgencyImpact": {
    "amountFronted": 850.00,
    "newLearnerOwed": 1850.00
  },
  "learnerAgencyImpact": {
    "downPaymentDeducted": 42.50,
    "newBalance": 99.50
  }
}
```

---

## 🎓 Parenting Philosophy & Usage Tips

### Age-Appropriate Implementation

**Ages 6-8: Task Basics**

- Simple one-time tasks only
- Visual task cards with pictures
- Immediate gratification (spend earned agency same day)
- No credit score (just earning and spending)
- Parent approves every transaction

**Ages 9-12: Credit Introduction**

- Introduce credit score concept
- Simple recurring tasks
- Per-cycle limits enforced
- Can save toward small goals ($50-$200)
- Starter financing available (up to $50, very short terms)
- Required monthly "reports" (simple: what I learned)

**Ages 13-15: Credit Building**

- Full credit score system active
- Complex tasks and recurring responsibilities
- Larger financing available based on score
- Business loan eligibility
- Savings goals with parent matching
- Detailed monthly reports required

**Ages 16-18: Real-World Simulation**

- Highest tier agreements available
- Can take on larger projects (lemonade stand → online business)
- Line of credit option
- Practice for real credit cards
- Financial literacy "graduation" before age 18

### Conversation Starters

**When introducing the system:**
"We're going to practice how money works in the real world. You'll earn money by helping out, and you can save up for things you want. As you get better at managing money, you'll unlock new ways to reach your goals faster."

**When they want something expensive:**
"That's a great goal! Let's look at your options. You could save up, which takes time but is safest. Or we could set up a loan, where you get it now but pay us back over time with a little extra. What sounds better to you?"

**When they miss a payment:**
"I see you didn't have enough for your payment this month. In the real world, this hurts your credit score and costs extra money. Let's talk about what happened and how to prevent it next time. Do you need to take on more tasks, or spend less?"

**When their score goes up:**
"Your credit score went up! That means you've been really responsible. Now you're qualified for better loan terms. If you wanted to finance something, it would cost you less because we trust you'll pay it back."

---

##
