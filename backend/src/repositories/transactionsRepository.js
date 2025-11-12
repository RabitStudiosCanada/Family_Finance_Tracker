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

const findByUserId = ({
  userId,
  type,
  startDate,
  endDate,
  category,
  creditCardId,
}) => {
  const query = baseQuery().where('transactions.user_id', userId);

  if (type) {
    query.andWhere('transactions.type', type);
  }

  if (startDate) {
    query.andWhere('transactions.transaction_date', '>=', startDate);
  }

  if (endDate) {
    query.andWhere('transactions.transaction_date', '<=', endDate);
  }

  if (category) {
    query.andWhereRaw(
      'LOWER(transactions.category) = ?',
      category.toLowerCase()
    );
  }

  if (creditCardId) {
    query.andWhere('transactions.credit_card_id', creditCardId);
  }

  return query
    .orderBy('transactions.transaction_date', 'desc')
    .orderBy('transactions.created_at', 'desc');
};

const calculateCategorySpend = async ({
  userId,
  category,
  startDate,
  endDate,
}) => {
  const normalizedCategory = category?.trim().toLowerCase();

  const result = await db(TABLE_NAME)
    .where('transactions.user_id', userId)
    .andWhere('transactions.type', 'expense')
    .andWhere('transactions.is_pending', false)
    .modify((query) => {
      if (startDate) {
        query.andWhere('transactions.transaction_date', '>=', startDate);
      }

      if (endDate) {
        query.andWhere('transactions.transaction_date', '<=', endDate);
      }

      if (normalizedCategory) {
        query.andWhereRaw('LOWER(transactions.category) = ?', [
          normalizedCategory,
        ]);
      }
    })
    .select(
      db.raw(
        `COALESCE(SUM(CASE
            WHEN transactions.amount_cents < 0 THEN -transactions.amount_cents
            ELSE transactions.amount_cents
          END), 0) AS total_spent`
      )
    )
    .first();

  const total = result?.total_spent ?? 0;

  return Number(total);
};

const findByUserIdWithinDateRange = ({ userId, startDate, endDate, type }) => {
  const query = baseQuery().where('transactions.user_id', userId);

  if (startDate) {
    query.andWhere('transactions.transaction_date', '>=', startDate);
  }

  if (endDate) {
    query.andWhere('transactions.transaction_date', '<=', endDate);
  }

  if (type) {
    query.andWhere('transactions.type', type);
  }

  return query.orderBy('transactions.transaction_date', 'asc');
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
  findByUserIdWithinDateRange,
  calculateCategorySpend,
  create,
  updateById,
  deleteById,
};
