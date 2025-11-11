const db = require('../db/knex').connection;

const TABLE_NAME = 'income_streams';

const baseQuery = () =>
  db(TABLE_NAME).select(
    'income_streams.id',
    'income_streams.user_id',
    'income_streams.name',
    'income_streams.amount_cents',
    'income_streams.frequency',
    'income_streams.next_expected_date',
    'income_streams.is_active',
    'income_streams.notes',
    'income_streams.created_at',
    'income_streams.updated_at'
  );

const applyActiveFilter = (query, includeInactive = false) =>
  includeInactive ? query : query.where('income_streams.is_active', true);

const findById = async (id, { includeInactive = false } = {}) =>
  applyActiveFilter(
    baseQuery().where('income_streams.id', id),
    includeInactive
  ).first();

const findByUserId = ({ userId, includeInactive = false }) =>
  applyActiveFilter(
    baseQuery().where('income_streams.user_id', userId),
    includeInactive
  ).orderBy('income_streams.created_at', 'desc');

const create = async (stream) => {
  await db(TABLE_NAME).insert({
    ...stream,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });

  return findById(stream.id, { includeInactive: true });
};

const updateById = async (id, updates) => {
  await db(TABLE_NAME)
    .where({ id })
    .update({
      ...updates,
      updated_at: db.fn.now(),
    });

  return findById(id, { includeInactive: true });
};

const archiveById = async (id) => {
  await db(TABLE_NAME).where({ id }).update({
    is_active: false,
    updated_at: db.fn.now(),
  });

  return findById(id, { includeInactive: true });
};

module.exports = {
  findById,
  findByUserId,
  create,
  updateById,
  archiveById,
};
