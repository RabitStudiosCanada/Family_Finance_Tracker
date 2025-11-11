const db = require('../db/knex').connection;

const TABLE_NAME = 'savings_goals';

const contributionTotalSubquery = () =>
  db('savings_contributions')
    .select(db.raw('COALESCE(SUM(amount_cents), 0)'))
    .whereRaw('savings_contributions.goal_id = savings_goals.id');

const baseQuery = () =>
  db(TABLE_NAME).select(
    'savings_goals.id',
    'savings_goals.owner_user_id',
    'savings_goals.name',
    'savings_goals.target_amount_cents',
    'savings_goals.start_date',
    'savings_goals.target_date',
    'savings_goals.status',
    'savings_goals.category',
    'savings_goals.notes',
    'savings_goals.completed_at',
    'savings_goals.abandoned_at',
    'savings_goals.abandoned_reason',
    'savings_goals.created_at',
    'savings_goals.updated_at',
    contributionTotalSubquery().as('total_contributions_cents')
  );

const findById = (id) => baseQuery().where('savings_goals.id', id).first();

const findByOwnerId = ({ ownerUserId, statuses }) => {
  const query = baseQuery().where('savings_goals.owner_user_id', ownerUserId);

  if (statuses && statuses.length > 0) {
    query.whereIn('savings_goals.status', statuses);
  }

  return query.orderBy('savings_goals.created_at', 'asc');
};

const create = async (goal) => {
  await db(TABLE_NAME).insert({
    ...goal,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });

  return findById(goal.id);
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

const sumOutstandingCommitmentsByUserId = async (userId) => {
  const goals = await baseQuery()
    .where('savings_goals.owner_user_id', userId)
    .andWhere('savings_goals.status', 'active');

  return goals.reduce((sum, goal) => {
    const contributions = Number(goal.total_contributions_cents ?? 0);
    const outstanding = goal.target_amount_cents - contributions;
    return sum + (outstanding > 0 ? outstanding : 0);
  }, 0);
};

module.exports = {
  findById,
  findByOwnerId,
  create,
  updateById,
  sumOutstandingCommitmentsByUserId,
};
