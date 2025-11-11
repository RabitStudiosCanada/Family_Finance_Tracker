const db = require('../db/knex').connection;

const TABLE_NAME = 'projected_expenses';

const baseQuery = () =>
  db(TABLE_NAME).select(
    'projected_expenses.id',
    'projected_expenses.user_id',
    'projected_expenses.credit_card_id',
    'projected_expenses.transaction_id',
    'projected_expenses.amount_cents',
    'projected_expenses.category',
    'projected_expenses.expected_date',
    'projected_expenses.status',
    'projected_expenses.notes',
    'projected_expenses.committed_at',
    'projected_expenses.paid_at',
    'projected_expenses.cancelled_at',
    'projected_expenses.cancelled_reason',
    'projected_expenses.created_at',
    'projected_expenses.updated_at'
  );

const findById = (id) => baseQuery().where('projected_expenses.id', id).first();

const findByUserId = ({ userId, statuses }) => {
  const query = baseQuery().where('projected_expenses.user_id', userId);

  if (statuses && statuses.length > 0) {
    query.whereIn('projected_expenses.status', statuses);
  }

  return query.orderBy('projected_expenses.expected_date', 'asc');
};

const create = async (expense) => {
  await db(TABLE_NAME).insert({
    ...expense,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });

  return findById(expense.id);
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

const sumOpenAmountsByUserId = async (userId) => {
  const result = await db(TABLE_NAME)
    .where('user_id', userId)
    .whereIn('status', ['planned', 'committed'])
    .sum({ total: 'amount_cents' })
    .first();

  if (!result || result.total === null) {
    return 0;
  }

  return Number(result.total);
};

module.exports = {
  findById,
  findByUserId,
  create,
  updateById,
  deleteById,
  sumOpenAmountsByUserId,
};
