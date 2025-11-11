const db = require('../db/knex').connection;

const TABLE_NAME = 'savings_contributions';

const baseQuery = () =>
  db(TABLE_NAME).select(
    'savings_contributions.id',
    'savings_contributions.goal_id',
    'savings_contributions.user_id',
    'savings_contributions.amount_cents',
    'savings_contributions.source',
    'savings_contributions.contribution_date',
    'savings_contributions.notes',
    'savings_contributions.created_at',
    'savings_contributions.updated_at'
  );

const findById = (id) =>
  baseQuery().where('savings_contributions.id', id).first();

const findByGoalId = (goalId) =>
  baseQuery()
    .where('savings_contributions.goal_id', goalId)
    .orderBy('savings_contributions.contribution_date', 'desc');

const create = async (contribution) => {
  await db(TABLE_NAME).insert({
    ...contribution,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });

  return findById(contribution.id);
};

const deleteById = (id) => db(TABLE_NAME).where({ id }).del();

module.exports = {
  findById,
  findByGoalId,
  create,
  deleteById,
};
