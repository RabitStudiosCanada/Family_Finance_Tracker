const db = require('../db/knex').connection;

const TABLE_NAME = 'users';

const baseQuery = () =>
  db(TABLE_NAME)
    .select(
      'users.id',
      'users.role_id',
      'users.email',
      'users.password_hash',
      'users.first_name',
      'users.last_name',
      'users.is_active',
      'users.archived_at',
      'users.created_at',
      'users.updated_at',
      'roles.code as role_code',
      'roles.name as role_name'
    )
    .leftJoin('roles', 'users.role_id', 'roles.id');

const applyActiveFilter = (query, includeInactive = false) =>
  includeInactive ? query : query.where('users.is_active', true);

const findByEmail = async (email, { includeInactive = false } = {}) =>
  applyActiveFilter(baseQuery().where('users.email', email.toLowerCase()), includeInactive).first();

const findById = async (id, { includeInactive = false } = {}) =>
  applyActiveFilter(baseQuery().where('users.id', id), includeInactive).first();

const findAll = ({ includeInactive = false } = {}) =>
  applyActiveFilter(baseQuery(), includeInactive).orderBy('users.created_at', 'desc');

const create = async (user) => {
  await db(TABLE_NAME).insert({
    ...user,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });

  return findById(user.id, { includeInactive: true });
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
  await db(TABLE_NAME)
    .where({ id })
    .update({
      is_active: false,
      archived_at: db.fn.now(),
      updated_at: db.fn.now(),
    });

  return findById(id, { includeInactive: true });
};

const updatePasswordHash = async (id, passwordHash) =>
  db(TABLE_NAME)
    .where({ id })
    .update({
      password_hash: passwordHash,
      updated_at: db.fn.now(),
    });

const recordSuccessfulLogin = async (id) =>
  db(TABLE_NAME)
    .where({ id })
    .update({
      updated_at: db.fn.now(),
    });

module.exports = {
  findAll,
  findByEmail,
  findById,
  create,
  updateById,
  archiveById,
  updatePasswordHash,
  recordSuccessfulLogin,
};
