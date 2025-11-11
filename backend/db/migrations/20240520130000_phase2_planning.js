const addTimestamps = (table, knex) => {
  table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
};

exports.up = async function up(knex) {
  const client = knex.client.config.client;
  const isPostgres = ['pg', 'postgres', 'postgresql'].includes(
    String(client).toLowerCase()
  );
  const enumOptions = (enumName) =>
    isPostgres
      ? {
          useNative: true,
          enumName,
        }
      : undefined;

  await knex.schema.createTable('projected_expenses', (table) => {
    table.uuid('id').primary();
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .uuid('credit_card_id')
      .references('id')
      .inTable('credit_cards')
      .onDelete('SET NULL');
    table
      .uuid('transaction_id')
      .references('id')
      .inTable('transactions')
      .onDelete('SET NULL');
    table.integer('amount_cents').notNullable();
    table.string('category', 120).notNullable();
    table.date('expected_date').notNullable();
    table
      .enu(
        'status',
        ['planned', 'committed', 'paid', 'cancelled'],
        enumOptions('projected_expense_status')
      )
      .notNullable()
      .defaultTo('planned');
    table.string('notes', 500);
    table.timestamp('committed_at');
    table.timestamp('paid_at');
    table.timestamp('cancelled_at');
    table.string('cancelled_reason', 500);
    addTimestamps(table, knex);
    table.check('amount_cents > 0', [], 'projected_expenses_amount_positive');
  });

  await knex.schema.createTable('savings_goals', (table) => {
    table.uuid('id').primary();
    table
      .uuid('owner_user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('name', 150).notNullable();
    table.integer('target_amount_cents').notNullable();
    table.date('start_date').notNullable();
    table.date('target_date');
    table
      .enu(
        'status',
        ['active', 'completed', 'abandoned'],
        enumOptions('savings_goal_status')
      )
      .notNullable()
      .defaultTo('active');
    table.string('category', 120);
    table.string('notes', 500);
    table.timestamp('completed_at');
    table.timestamp('abandoned_at');
    table.string('abandoned_reason', 500);
    addTimestamps(table, knex);
    table.check(
      'target_amount_cents > 0',
      [],
      'savings_goals_target_positive_check'
    );
  });

  await knex.schema.createTable('savings_contributions', (table) => {
    table.uuid('id').primary();
    table
      .uuid('goal_id')
      .notNullable()
      .references('id')
      .inTable('savings_goals')
      .onDelete('CASCADE');
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.integer('amount_cents').notNullable();
    table
      .enu(
        'source',
        ['manual', 'transfer', 'automation'],
        enumOptions('savings_contribution_source')
      )
      .notNullable()
      .defaultTo('manual');
    table.date('contribution_date').notNullable();
    table.string('notes', 500);
    addTimestamps(table, knex);
    table.check(
      'amount_cents > 0',
      [],
      'savings_contributions_amount_positive'
    );
  });

  await knex.schema.createTable('category_budgets', (table) => {
    table.uuid('id').primary();
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('category', 120).notNullable();
    table
      .enu(
        'period',
        ['monthly', 'cycle'],
        enumOptions('category_budget_period')
      )
      .notNullable()
      .defaultTo('monthly');
    table.integer('limit_amount_cents').notNullable();
    table.decimal('warning_threshold', 5, 4).notNullable().defaultTo(0.85);
    table.date('period_start_date');
    table.date('period_end_date');
    table.boolean('is_active').notNullable().defaultTo(true);
    addTimestamps(table, knex);
    table.unique(['user_id', 'category', 'period']);
    table.check(
      'limit_amount_cents > 0',
      [],
      'category_budgets_limit_positive_check'
    );
    table.check(
      'warning_threshold >= 0 AND warning_threshold <= 1',
      [],
      'category_budgets_warning_threshold_range'
    );
  });

  await knex.schema.alterTable('agency_snapshots', (table) => {
    table.integer('projected_expense_total_cents').notNullable().defaultTo(0);
    table.integer('savings_commitments_cents').notNullable().defaultTo(0);
    table.integer('safe_to_spend_cents').notNullable().defaultTo(0);
  });
};

exports.down = async function down(knex) {
  const client = knex.client.config.client;
  const isPostgres = ['pg', 'postgres', 'postgresql'].includes(
    String(client).toLowerCase()
  );

  await knex.schema.alterTable('agency_snapshots', (table) => {
    table.dropColumn('safe_to_spend_cents');
    table.dropColumn('savings_commitments_cents');
    table.dropColumn('projected_expense_total_cents');
  });

  await knex.schema.dropTableIfExists('category_budgets');
  await knex.schema.dropTableIfExists('savings_contributions');
  await knex.schema.dropTableIfExists('savings_goals');
  await knex.schema.dropTableIfExists('projected_expenses');

  if (isPostgres) {
    await knex.schema.raw('DROP TYPE IF EXISTS category_budget_period');
    await knex.schema.raw('DROP TYPE IF EXISTS savings_contribution_source');
    await knex.schema.raw('DROP TYPE IF EXISTS savings_goal_status');
    await knex.schema.raw('DROP TYPE IF EXISTS projected_expense_status');
  }
};
