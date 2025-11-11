const createError = require('http-errors');
const { randomUUID } = require('node:crypto');

const creditCardsRepository = require('../repositories/creditCardsRepository');
const usersRepository = require('../repositories/usersRepository');
const { serializeCreditCard } = require('../utils/serializers');

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

const ensureCardAccessible = (currentUser, card) => {
  if (!card) {
    throw createError(404, 'Credit card not found');
  }

  if (currentUser.role !== 'admin' && card.user_id !== currentUser.id) {
    throw createError(404, 'Credit card not found');
  }
};

const toDatabaseCreditCard = ({
  id,
  userId,
  nickname,
  issuer,
  lastFour,
  creditLimitCents,
  cycleAnchorDay,
  statementDay,
  paymentDueDay,
  autopayEnabled,
  openedAt,
  closedAt,
}) =>
  Object.fromEntries(
    Object.entries({
      id,
      user_id: userId,
      nickname,
      issuer,
      last_four: lastFour,
      credit_limit_cents: creditLimitCents,
      cycle_anchor_day: cycleAnchorDay,
      statement_day: statementDay,
      payment_due_day: paymentDueDay,
      autopay_enabled: autopayEnabled,
      opened_at: openedAt,
      closed_at: closedAt,
    }).filter(([, value]) => value !== undefined)
  );

const listCreditCards = async (
  currentUser,
  { includeInactive = false, userId } = {}
) => {
  const targetUserId = await resolveTargetUserId(currentUser, userId);
  const cards = await creditCardsRepository.findByUserId({
    userId: targetUserId,
    includeInactive,
  });

  return cards.map(serializeCreditCard);
};

const getCreditCard = async (currentUser, id) => {
  const card = await creditCardsRepository.findById(id, {
    includeInactive: true,
  });

  ensureCardAccessible(currentUser, card);

  return serializeCreditCard(card);
};

const createCreditCard = async (currentUser, payload) => {
  const targetUserId = await resolveTargetUserId(currentUser, payload.userId);
  const id = randomUUID();

  const created = await creditCardsRepository.create(
    toDatabaseCreditCard({
      ...payload,
      id,
      userId: targetUserId,
      autopayEnabled: payload.autopayEnabled ?? false,
    })
  );

  return serializeCreditCard(created);
};

const updateCreditCard = async (currentUser, id, payload) => {
  const existing = await creditCardsRepository.findById(id, {
    includeInactive: true,
  });

  ensureCardAccessible(currentUser, existing);

  const updates = toDatabaseCreditCard(payload);

  if (Object.keys(updates).length === 0) {
    return serializeCreditCard(existing);
  }

  const updated = await creditCardsRepository.updateById(id, updates);

  return serializeCreditCard(updated);
};

const archiveCreditCard = async (currentUser, id) => {
  const existing = await creditCardsRepository.findById(id, {
    includeInactive: true,
  });

  ensureCardAccessible(currentUser, existing);

  await creditCardsRepository.archiveById(id);
};

module.exports = {
  listCreditCards,
  getCreditCard,
  createCreditCard,
  updateCreditCard,
  archiveCreditCard,
};
