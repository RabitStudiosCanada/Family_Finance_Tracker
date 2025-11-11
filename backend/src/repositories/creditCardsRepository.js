const db = require('../db/knex').connection;

const TABLE_NAME = 'credit_cards';

const baseQuery = () =>
  db(TABLE_NAME).select(
    'credit_cards.id',
    'credit_cards.user_id',
    'credit_cards.nickname',
    'credit_cards.issuer',
    'credit_cards.last_four',
    'credit_cards.credit_limit_cents',
    'credit_cards.cycle_anchor_day',
    'credit_cards.statement_day',
    'credit_cards.payment_due_day',
    'credit_cards.autopay_enabled',
    'credit_cards.is_active',
    'credit_cards.opened_at',
    'credit_cards.closed_at',
    'credit_cards.created_at',
    'credit_cards.updated_at'
  );

const applyActiveFilter = (query, includeInactive = false) =>
  includeInactive ? query : query.where('credit_cards.is_active', true);

const findById = async (id, { includeInactive = false } = {}) =>
  applyActiveFilter(
    baseQuery().where('credit_cards.id', id),
    includeInactive
  ).first();

const findByUserId = ({ userId, includeInactive = false }) =>
  applyActiveFilter(
    baseQuery().where('credit_cards.user_id', userId),
    includeInactive
  ).orderBy('credit_cards.nickname', 'asc');

const create = async (card) => {
  await db(TABLE_NAME).insert({
    ...card,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });

  return findById(card.id, { includeInactive: true });
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
