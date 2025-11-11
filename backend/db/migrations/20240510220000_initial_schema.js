const addTimestamps = (table, knex) => {
  table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
};

exports.up = async function up(knex) {
  await knex.schema.createTable('roles', (table) => {
    table.increments('id').primary();
    table.string('code', 50).notNullable().unique();
    table.string('name', 100).notNullable();
    table.string('description', 255);
    addTimestamps(table, knex);
  });

  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary();
    table
      .integer('role_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('roles')
      .onDelete('RESTRICT');
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('archived_at');
    addTimestamps(table, knex);
  });

  await knex.schema.createTable('credit_cards', (table) => {
    table.uuid('id').primary();
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('nickname', 120).notNullable();
    table.string('issuer', 120);
    table.string('last_four', 4);
    table.integer('credit_limit_cents').notNullable();
    table
      .integer('cycle_anchor_day')
      .notNullable()
      .comment('Day of month when spending cycle starts');
    table
      .integer('statement_day')
      .notNullable()
      .comment('Day of month when statement closes');
    table
      .integer('payment_due_day')
      .notNullable()
      .comment('Day of month when payment is due');
    table.boolean('autopay_enabled').notNullable().defaultTo(false);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('opened_at');
    table.timestamp('closed_at');
    addTimestamps(table, knex);
    table.check(
      'cycle_anchor_day BETWEEN 1 AND 31',
      [],
      'credit_cards_cycle_anchor_day_check'
    );
    table.check(
      'statement_day BETWEEN 1 AND 31',
      [],
      'credit_cards_statement_day_check'
    );
    table.check(
      'payment_due_day BETWEEN 1 AND 31',
      [],
      'credit_cards_payment_due_day_check'
    );
    table.check(
      'credit_limit_cents > 0',
      [],
      'credit_cards_credit_limit_positive'
    );
  });

  await knex.schema.createTable('income_streams', (table) => {
    table.uuid('id').primary();
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('name', 120).notNullable();
    table.integer('amount_cents').notNullable();
    table
      .enu('frequency', [
        'weekly',
        'biweekly',
        'semimonthly',
        'monthly',
        'quarterly',
        'annually',
      ])
      .notNullable();
    table.date('next_expected_date');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.string('notes', 500);
    addTimestamps(table, knex);
    table.check('amount_cents > 0', [], 'income_streams_amount_positive_check');
  });

  await knex.schema.createTable('credit_card_cycles', (table) => {
    table.uuid('id').primary();
    table
      .uuid('credit_card_id')
      .notNullable()
      .references('id')
      .inTable('credit_cards')
      .onDelete('CASCADE');
    table.integer('cycle_number').notNullable();
    table.date('cycle_start_date').notNullable();
    table.date('statement_date').notNullable();
    table.date('payment_due_date').notNullable();
    table.integer('statement_balance_cents').notNullable().defaultTo(0);
    table.integer('minimum_payment_cents').notNullable().defaultTo(0);
    table.date('payment_recorded_on');
    table.timestamp('closed_at');
    addTimestamps(table, knex);
    table.unique(['credit_card_id', 'cycle_number']);
    table.check(
      'cycle_number > 0',
      [],
      'credit_card_cycles_cycle_number_positive'
    );
    table.check(
      'statement_balance_cents >= 0',
      [],
      'credit_card_cycles_balance_non_negative'
    );
    table.check(
      'minimum_payment_cents >= 0',
      [],
      'credit_card_cycles_minimum_non_negative'
    );
  });

  await knex.schema.createTable('transactions', (table) => {
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
      .uuid('income_stream_id')
      .references('id')
      .inTable('income_streams')
      .onDelete('SET NULL');
    table
      .uuid('card_cycle_id')
      .references('id')
      .inTable('credit_card_cycles')
      .onDelete('SET NULL');
    table
      .enu('type', ['expense', 'income', 'payment', 'transfer'])
      .notNullable();
    table.integer('amount_cents').notNullable();
    table.string('currency', 3).notNullable().defaultTo('CAD');
    table.string('category', 120).notNullable();
    table.date('transaction_date').notNullable();
    table.boolean('is_pending').notNullable().defaultTo(false);
    table.string('merchant', 120);
    table.string('memo', 500);
    table.timestamp('occurred_at').notNullable().defaultTo(knex.fn.now());
    addTimestamps(table, knex);
    table.check('amount_cents <> 0', [], 'transactions_amount_cents_check');
    table.check(
      `CASE WHEN type IN ('expense', 'payment') THEN credit_card_id IS NOT NULL ELSE 1 END`,
      [],
      'transactions_card_presence_check'
    );
  });

  await knex.schema.createTable('agency_snapshots', (table) => {
    table.uuid('id').primary();
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.date('calculated_for').notNullable();
    table.integer('credit_agency_cents').notNullable();
    table.integer('backed_agency_cents').notNullable();
    table.integer('available_credit_cents').notNullable();
    table.integer('projected_obligations_cents').notNullable().defaultTo(0);
    table.timestamp('calculated_at').notNullable().defaultTo(knex.fn.now());
    table.string('notes', 500);
    addTimestamps(table, knex);
    table.unique(['user_id', 'calculated_for']);
    table.check(
      'credit_agency_cents >= 0',
      [],
      'agency_snapshots_credit_non_negative'
    );
    table.check(
      'backed_agency_cents >= 0',
      [],
      'agency_snapshots_backed_non_negative'
    );
    table.check(
      'available_credit_cents >= 0',
      [],
      'agency_snapshots_available_non_negative'
    );
    table.check(
      'projected_obligations_cents >= 0',
      [],
      'agency_snapshots_obligations_non_negative'
    );
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('agency_snapshots');
  await knex.schema.dropTableIfExists('transactions');
  await knex.schema.dropTableIfExists('credit_card_cycles');
  await knex.schema.dropTableIfExists('income_streams');
  await knex.schema.dropTableIfExists('credit_cards');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('roles');
};
