const createError = require('http-errors');
const { randomUUID } = require('node:crypto');

const incomeStreamsRepository = require('../repositories/incomeStreamsRepository');
const usersRepository = require('../repositories/usersRepository');
const { serializeIncomeStream } = require('../utils/serializers');

const resolveTargetUserId = async (currentUser, requestedUserId) => {
  if (currentUser.role === 'admin') {
    if (!requestedUserId) {
      return currentUser.id;
    }

    const targetUser = await usersRepository.findById(requestedUserId, {
      includeInactive: true,
    });

    if (!targetUser) {
      throw createError(404, 'User not found');
    }

    return requestedUserId;
  }

  if (requestedUserId && requestedUserId !== currentUser.id) {
    throw createError(
      403,
      'You do not have permission to manage this resource'
    );
  }

  return currentUser.id;
};

const ensureStreamAccessible = (currentUser, stream) => {
  if (!stream) {
    throw createError(404, 'Income stream not found');
  }

  if (currentUser.role !== 'admin' && stream.user_id !== currentUser.id) {
    throw createError(404, 'Income stream not found');
  }
};

const toDatabaseIncomeStream = ({
  id,
  userId,
  name,
  amountCents,
  frequency,
  nextExpectedDate,
  isActive,
  notes,
}) =>
  Object.fromEntries(
    Object.entries({
      id,
      user_id: userId,
      name,
      amount_cents: amountCents,
      frequency,
      next_expected_date: nextExpectedDate,
      is_active: isActive,
      notes,
    }).filter(([, value]) => value !== undefined)
  );

const listIncomeStreams = async (
  currentUser,
  { includeInactive = false, userId } = {}
) => {
  const targetUserId = await resolveTargetUserId(currentUser, userId);
  const streams = await incomeStreamsRepository.findByUserId({
    userId: targetUserId,
    includeInactive,
  });

  return streams.map(serializeIncomeStream);
};

const getIncomeStream = async (currentUser, id) => {
  const stream = await incomeStreamsRepository.findById(id, {
    includeInactive: true,
  });

  ensureStreamAccessible(currentUser, stream);

  return serializeIncomeStream(stream);
};

const createIncomeStream = async (currentUser, payload) => {
  const targetUserId = await resolveTargetUserId(currentUser, payload.userId);
  const id = randomUUID();

  const created = await incomeStreamsRepository.create(
    toDatabaseIncomeStream({
      ...payload,
      id,
      userId: targetUserId,
      isActive: payload.isActive ?? true,
    })
  );

  return serializeIncomeStream(created);
};

const updateIncomeStream = async (currentUser, id, payload) => {
  const existing = await incomeStreamsRepository.findById(id, {
    includeInactive: true,
  });

  ensureStreamAccessible(currentUser, existing);

  const updates = toDatabaseIncomeStream(payload);

  if (Object.keys(updates).length === 0) {
    return serializeIncomeStream(existing);
  }

  const updated = await incomeStreamsRepository.updateById(id, updates);

  return serializeIncomeStream(updated);
};

const archiveIncomeStream = async (currentUser, id) => {
  const existing = await incomeStreamsRepository.findById(id, {
    includeInactive: true,
  });

  ensureStreamAccessible(currentUser, existing);

  await incomeStreamsRepository.archiveById(id);
};

module.exports = {
  listIncomeStreams,
  getIncomeStream,
  createIncomeStream,
  updateIncomeStream,
  archiveIncomeStream,
};
