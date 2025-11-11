const createError = require('http-errors');
const { randomUUID } = require('node:crypto');

const usersRepository = require('../repositories/usersRepository');
const { hashPassword } = require('../utils/password');
const { serializeUser } = require('../utils/serializers');

const toDatabaseUser = ({
  email,
  firstName,
  lastName,
  roleId,
  passwordHash,
  id,
  isActive,
  archivedAt,
}) =>
  Object.fromEntries(
    Object.entries({
      id,
      role_id: roleId,
      email: email && email.toLowerCase(),
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      is_active: isActive,
      archived_at: archivedAt,
    }).filter(([, value]) => value !== undefined)
  );

const ensureEmailAvailable = async (email, { excludeUserId } = {}) => {
  if (!email) {
    return;
  }

  const existing = await usersRepository.findByEmail(email, { includeInactive: true });

  if (existing && existing.id !== excludeUserId) {
    throw createError(409, 'Email is already in use');
  }
};

const listUsers = async ({ includeArchived = false } = {}) => {
  const users = await usersRepository.findAll({ includeInactive: includeArchived });

  return users.map(serializeUser);
};

const getUserById = async (id) => {
  const user = await usersRepository.findById(id, { includeInactive: true });

  if (!user) {
    throw createError(404, 'User not found');
  }

  return serializeUser(user);
};

const createUser = async ({ email, password, firstName, lastName, roleId }) => {
  await ensureEmailAvailable(email);

  const passwordHash = await hashPassword(password);
  const id = randomUUID();

  const created = await usersRepository.create(
    toDatabaseUser({
      id,
      email,
      passwordHash,
      firstName,
      lastName,
      roleId,
      isActive: true,
    })
  );

  return serializeUser(created);
};

const updateUser = async (id, { email, firstName, lastName, roleId }) => {
  const existing = await usersRepository.findById(id, { includeInactive: true });

  if (!existing) {
    throw createError(404, 'User not found');
  }

  await ensureEmailAvailable(email, { excludeUserId: id });

  const updates = toDatabaseUser({ email, firstName, lastName, roleId });

  if (Object.keys(updates).length === 0) {
    return serializeUser(existing);
  }

  const updated = await usersRepository.updateById(id, updates);

  return serializeUser(updated);
};

const archiveUser = async (id) => {
  const existing = await usersRepository.findById(id, { includeInactive: true });

  if (!existing) {
    throw createError(404, 'User not found');
  }

  if (!existing.is_active) {
    return serializeUser(existing);
  }

  const archived = await usersRepository.archiveById(id);

  return serializeUser(archived);
};

const resetPassword = async (id, password) => {
  const existing = await usersRepository.findById(id, { includeInactive: true });

  if (!existing) {
    throw createError(404, 'User not found');
  }

  const passwordHash = await hashPassword(password);

  await usersRepository.updatePasswordHash(id, passwordHash);
};

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  archiveUser,
  resetPassword,
};
