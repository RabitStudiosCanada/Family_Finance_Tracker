const db = require('../db/knex').connection;

const TABLE_NAME = 'category_budgets';

const baseQuery = () =>
  db(TABLE_NAME).select(
    'category_budgets.id',
    'category_budgets.user_id',
    'category_budgets.category',
    'category_budgets.period',
    'category_budgets.limit_amount_cents',
    'category_budgets.warning_threshold',
    'category_budgets.period_start_date',
    'category_budgets.period_end_date',
    'category_budgets.is_active',
    'category_budgets.created_at',
    'category_budgets.updated_at'
  );

const findById = (id) => baseQuery().where('category_budgets.id', id).first();

const findByUserId = ({ userId, includeInactive = false }) => {
  const query = baseQuery().where('category_budgets.user_id', userId);

  if (!includeInactive) {
    query.andWhere('category_budgets.is_active', true);
  }

  return query.orderBy('category_budgets.category', 'asc');
};

const create = async (budget) => {
  await db(TABLE_NAME).insert({
    ...budget,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });

  return findById(budget.id);
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
