const bcrypt = require('bcryptjs');

const toCents = (amount) => Math.round(amount * 100);
const hashPassword = (password) => bcrypt.hashSync(password, 10);
const DEFAULT_USER_PASSWORD = 'AgencyPass123!';

exports.seed = async function seed(knex) {
  await knex('agency_snapshots').del();
  await knex('savings_contributions').del();
  await knex('savings_goals').del();
  await knex('category_budgets').del();
  await knex('projected_expenses').del();
  await knex('transactions').del();
  await knex('credit_card_cycles').del();
  await knex('income_streams').del();
  await knex('credit_cards').del();
  await knex('users').del();
  await knex('roles').del();

  const roles = [
    {
      id: 1,
      code: 'admin',
      name: 'Administrator',
      description: 'Full platform access',
    },
    {
      id: 2,
      code: 'adult',
      name: 'Adult',
      description: 'Parent or guardian account',
    },
    {
      id: 3,
      code: 'learner',
      name: 'Learner',
      description: 'Child account with guided access',
    },
  ];

  await knex('roles').insert(
    roles.map((role) => ({
      ...role,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    }))
  );

  const users = [
    {
      id: '0b9f8b26-78fa-4cb9-80c6-e6be75a8351f',
      role_id: 1,
      email: 'admin@agency.local',
      password_hash: hashPassword(DEFAULT_USER_PASSWORD),
      first_name: 'Avery',
      last_name: 'Admin',
    },
    {
      id: '2f4bc7c2-28b2-4560-802d-843a25309483',
      role_id: 2,
      email: 'jordan.parent@agency.local',
      password_hash: hashPassword(DEFAULT_USER_PASSWORD),
      first_name: 'Jordan',
      last_name: 'Parent',
    },
    {
      id: 'cd7a0cb4-f654-4c7e-b5f5-a48d7ad4198c',
      role_id: 2,
      email: 'casey.partner@agency.local',
      password_hash: hashPassword(DEFAULT_USER_PASSWORD),
      first_name: 'Casey',
      last_name: 'Partner',
    },
  ];

  await knex('users').insert(
    users.map((user) => ({
      ...user,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    }))
  );

  const creditCards = [
    {
      id: 'c33d1ce1-7fcb-4ce4-9e0f-8fe891c45f0a',
      user_id: users[1].id,
      nickname: 'Everyday Cashback',
      issuer: 'ScotiaBank',
      last_four: '4455',
      credit_limit_cents: toCents(10000),
      cycle_anchor_day: 10,
      statement_day: 8,
      payment_due_day: 3,
      autopay_enabled: true,
      opened_at: '2022-06-01T00:00:00.000Z',
    },
    {
      id: 'f2a5304d-b436-41f3-8d9a-2b1f4b44c58d',
      user_id: users[2].id,
      nickname: 'Travel Rewards',
      issuer: 'Amex',
      last_four: '8831',
      credit_limit_cents: toCents(15000),
      cycle_anchor_day: 15,
      statement_day: 13,
      payment_due_day: 7,
      autopay_enabled: false,
      opened_at: '2023-01-01T00:00:00.000Z',
    },
  ];

  await knex('credit_cards').insert(
    creditCards.map((card) => ({
      ...card,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    }))
  );

  const incomeStreams = [
    {
      id: 'e1a49894-7529-4e94-bfb5-23a50e7b6cb5',
      user_id: users[1].id,
      name: 'Product Design Salary',
      amount_cents: toCents(4200),
      frequency: 'semimonthly',
      next_expected_date: '2025-11-15',
    },
    {
      id: 'a4d9bf3f-9fcb-4b12-bcc1-1656db1c942b',
      user_id: users[1].id,
      name: 'Freelance UX Retainer',
      amount_cents: toCents(1200),
      frequency: 'monthly',
      next_expected_date: '2025-12-01',
    },
    {
      id: 'ef6d8020-2d7f-4db5-9f3a-f499b90acb19',
      user_id: users[2].id,
      name: 'Engineering Salary',
      amount_cents: toCents(5300),
      frequency: 'semimonthly',
      next_expected_date: '2025-11-20',
    },
  ];

  await knex('income_streams').insert(
    incomeStreams.map((stream) => ({
      ...stream,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    }))
  );

  const creditCardCycles = [
    {
      id: 'b0a421ae-7bc8-4d4b-ae1a-4941326d39c6',
      credit_card_id: creditCards[0].id,
      cycle_number: 37,
      cycle_start_date: '2025-10-10',
      statement_date: '2025-11-08',
      payment_due_date: '2025-12-03',
      statement_balance_cents: toCents(2640.75),
      minimum_payment_cents: toCents(120),
    },
    {
      id: '9ce0bb49-9e6e-48b5-a9cf-55f0a77e5e88',
      credit_card_id: creditCards[1].id,
      cycle_number: 12,
      cycle_start_date: '2025-10-15',
      statement_date: '2025-11-13',
      payment_due_date: '2025-12-07',
      statement_balance_cents: toCents(1845.9),
      minimum_payment_cents: toCents(92.3),
    },
  ];

  await knex('credit_card_cycles').insert(
    creditCardCycles.map((cycle) => ({
      ...cycle,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    }))
  );

  const transactions = [
    {
      id: '4d04b21c-9501-4d82-b4f0-fb66df3014a2',
      user_id: users[1].id,
      credit_card_id: creditCards[0].id,
      card_cycle_id: creditCardCycles[0].id,
      type: 'expense',
      amount_cents: -toCents(145.32),
      category: 'Groceries',
      transaction_date: '2025-11-01',
      merchant: 'Whole Foods',
      memo: 'Weekly groceries',
    },
    {
      id: '1ebeb60d-8fa5-4905-8aae-e0f510bc7d9a',
      user_id: users[1].id,
      credit_card_id: creditCards[0].id,
      card_cycle_id: creditCardCycles[0].id,
      type: 'expense',
      amount_cents: -toCents(82.49),
      category: 'Transportation',
      transaction_date: '2025-11-04',
      merchant: 'TransLink',
      memo: 'Monthly transit pass',
    },
    {
      id: '29dd8bea-41f4-4f3f-9f17-bf0ca660a89a',
      user_id: users[1].id,
      income_stream_id: incomeStreams[0].id,
      type: 'income',
      amount_cents: toCents(2100),
      category: 'Salary',
      transaction_date: '2025-11-01',
      merchant: 'Brightside Studios',
      memo: 'First November paycheque',
    },
    {
      id: 'b516f4cd-d6a9-4491-836f-5f0115dcbd21',
      user_id: users[2].id,
      credit_card_id: creditCards[1].id,
      card_cycle_id: creditCardCycles[1].id,
      type: 'expense',
      amount_cents: -toCents(620.11),
      category: 'Travel',
      transaction_date: '2025-10-22',
      merchant: 'Air Canada',
      memo: 'Holiday flights',
    },
    {
      id: 'f5a85e5b-cd27-4835-8555-1bf2d0058753',
      user_id: users[2].id,
      type: 'income',
      income_stream_id: incomeStreams[2].id,
      amount_cents: toCents(2650),
      category: 'Salary',
      transaction_date: '2025-10-31',
      merchant: 'LaunchForge',
      memo: 'End of month payroll',
    },
  ];

  await knex('transactions').insert(
    transactions.map((transaction) => ({
      ...transaction,
      currency: 'CAD',
      is_pending: false,
      occurred_at: `${transaction.transaction_date}T12:00:00.000Z`,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    }))
  );

  const projectedExpenses = [
    {
      id: 'a3cbf978-0aa0-4d9d-b6dd-73c2c58fb0b1',
      user_id: users[1].id,
      credit_card_id: creditCards[0].id,
      amount_cents: toCents(325.5),
      category: 'Groceries',
      expected_date: '2025-11-15',
      status: 'committed',
      notes: 'Holiday dinner ingredients',
      committed_at: knex.fn.now(),
    },
    {
      id: '62e6f3ff-4fa1-4ceb-a5b7-48e119d0238e',
      user_id: users[1].id,
      amount_cents: toCents(189.99),
      category: 'Utilities',
      expected_date: '2025-11-28',
      status: 'planned',
      notes: 'Electric bill projection',
    },
  ];

  await knex('projected_expenses').insert(
    projectedExpenses.map((expense) => ({
      ...expense,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    }))
  );

  const savingsGoals = [
    {
      id: 'df649f8e-22d4-4f01-8c5f-251af1d65231',
      owner_user_id: users[1].id,
      name: 'Emergency Fund',
      target_amount_cents: toCents(5000),
      start_date: '2025-10-01',
      target_date: '2026-04-01',
      status: 'active',
      category: 'Safety Net',
      notes: 'Six months of expenses',
    },
    {
      id: 'af5a09a0-b9f1-4d18-9fd5-82f6a0bd517d',
      owner_user_id: users[1].id,
      name: 'Family Vacation 2026',
      target_amount_cents: toCents(3200),
      start_date: '2025-09-01',
      target_date: '2026-06-15',
      status: 'active',
      category: 'Travel',
    },
  ];

  await knex('savings_goals').insert(
    savingsGoals.map((goal) => ({
      ...goal,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    }))
  );

  const savingsContributions = [
    {
      id: '515cc3d3-8f53-4ed3-9b95-89c0453a4b2f',
      goal_id: savingsGoals[0].id,
      user_id: users[1].id,
      amount_cents: toCents(500),
      source: 'manual',
      contribution_date: '2025-10-15',
      notes: 'Initial transfer',
    },
    {
      id: '7c706587-9f1e-420f-b94d-a9f6b7e6a35d',
      goal_id: savingsGoals[1].id,
      user_id: users[1].id,
      amount_cents: toCents(250),
      source: 'manual',
      contribution_date: '2025-10-20',
    },
  ];

  await knex('savings_contributions').insert(
    savingsContributions.map((contribution) => ({
      ...contribution,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    }))
  );

  const categoryBudgets = [
    {
      id: '6a28271c-9383-4f01-a1de-1ba459a6cf4e',
      user_id: users[1].id,
      category: 'Groceries',
      period: 'monthly',
      limit_amount_cents: toCents(900),
      warning_threshold: 0.85,
    },
    {
      id: '0d3db1a1-2e9f-4e49-86ec-8adbd26e4a8f',
      user_id: users[1].id,
      category: 'Dining Out',
      period: 'monthly',
      limit_amount_cents: toCents(300),
      warning_threshold: 0.8,
    },
  ];

  await knex('category_budgets').insert(
    categoryBudgets.map((budget) => ({
      ...budget,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    }))
  );

  const agencySnapshots = [
    {
      id: '02b321d5-8f09-48c4-a612-e9ed409fb8f5',
      user_id: users[1].id,
      calculated_for: '2025-11-01',
      credit_agency_cents: toCents(6859.25),
      backed_agency_cents: toCents(7152.19),
      available_credit_cents: toCents(7359.25),
      projected_obligations_cents: toCents(347.81),
      notes: 'Calculated from seeded Phase 1 data on November 1',
    },
    {
      id: '3de8e5ab-54f9-4bb3-8d64-a157dcd51430',
      user_id: users[2].id,
      calculated_for: '2025-11-01',
      credit_agency_cents: toCents(12404.1),
      backed_agency_cents: toCents(5207.7),
      available_credit_cents: toCents(13154.1),
      projected_obligations_cents: toCents(92.3),
      notes: 'Calculated from seeded Phase 1 data on November 1',
    },
  ];

  await knex('agency_snapshots').insert(
    agencySnapshots.map((snapshot) => ({
      ...snapshot,
      calculated_at: `${snapshot.calculated_for}T08:00:00.000Z`,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    }))
  );
};
