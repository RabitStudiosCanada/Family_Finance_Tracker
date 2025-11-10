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

const findByEmail = async (email) =>
  baseQuery().where('users.email', email.toLowerCase()).where('users.is_active', true).first();

const findById = async (id) => baseQuery().where('users.id', id).where('users.is_active', true).first();

const recordSuccessfulLogin = async (id) =>
  db(TABLE_NAME)
    .where({ id })
    .update({
      updated_at: db.fn.now(),
    });

module.exports = {
  findByEmail,
  findById,
  recordSuccessfulLogin,
};
