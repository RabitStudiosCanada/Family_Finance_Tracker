const db = require('../db/knex').connection;

const TABLE_NAME = 'transactions';

const baseQuery = () =>
  db(TABLE_NAME).select(
    'transactions.id',
    'transactions.user_id',
    'transactions.credit_card_id',
    'transactions.income_stream_id',
    'transactions.card_cycle_id',
    'transactions.type',
    'transactions.amount_cents',
    'transactions.currency',
    'transactions.category',
    'transactions.transaction_date',
    'transactions.is_pending',
    'transactions.merchant',
    'transactions.memo',
    'transactions.occurred_at',
    'transactions.created_at',
    'transactions.updated_at'
  );

const findById = (id) => baseQuery().where('transactions.id', id).first();

const findByUserId = ({ userId, type }) => {
  const query = baseQuery().where('transactions.user_id', userId);

  if (type) {
    query.andWhere('transactions.type', type);
  }

  return query.orderBy('transactions.transaction_date', 'desc');
};

const create = async (transaction) => {
  await db(TABLE_NAME).insert({
    ...transaction,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });

  return findById(transaction.id);
};

const updateById = async (id, updates) => {
  await db(TABLE_NAME)
    .where({ id })
    .update({
      ...updates,
      updated_at: db.fn.now(),
    });

  return findById(id);
};

const deleteById = (id) => db(TABLE_NAME).where({ id }).del();

module.exports = {
  findById,
  findByUserId,
  create,
  updateById,
  deleteById,
};
