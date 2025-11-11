const db = require('../db/knex').connection;

const TABLE_NAME = 'credit_card_cycles';

const baseQuery = () =>
  db(TABLE_NAME).select(
    'credit_card_cycles.id',
    'credit_card_cycles.credit_card_id',
    'credit_card_cycles.cycle_number',
    'credit_card_cycles.cycle_start_date',
    'credit_card_cycles.statement_date',
    'credit_card_cycles.payment_due_date',
    'credit_card_cycles.statement_balance_cents',
    'credit_card_cycles.minimum_payment_cents',
    'credit_card_cycles.payment_recorded_on',
    'credit_card_cycles.closed_at',
    'credit_card_cycles.created_at',
    'credit_card_cycles.updated_at'
  );

const findOpenByCreditCardIds = (creditCardIds = []) => {
  if (!creditCardIds.length) {
    return Promise.resolve([]);
  }

  return baseQuery()
    .whereIn('credit_card_cycles.credit_card_id', creditCardIds)
    .whereNull('credit_card_cycles.closed_at');
};

const findById = (id) => baseQuery().where('credit_card_cycles.id', id).first();

const updateById = async (id, updates) => {
  await db(TABLE_NAME)
    .where({ id })
    .update({
      ...updates,
      updated_at: db.fn.now(),
    });

  return findById(id);
};

module.exports = {
  findById,
  findOpenByCreditCardIds,
  updateById,
};
