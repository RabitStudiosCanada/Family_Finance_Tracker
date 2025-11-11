const createError = require('http-errors');
const { randomUUID } = require('node:crypto');

const creditCardsRepository = require('../repositories/creditCardsRepository');
const incomeStreamsRepository = require('../repositories/incomeStreamsRepository');
const transactionsRepository = require('../repositories/transactionsRepository');
const usersRepository = require('../repositories/usersRepository');
const { serializeTransaction } = require('../utils/serializers');

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

const ensureTransactionAccessible = (currentUser, transaction) => {
  if (!transaction) {
    throw createError(404, 'Transaction not found');
  }

  if (currentUser.role !== 'admin' && transaction.user_id !== currentUser.id) {
    throw createError(404, 'Transaction not found');
  }
};

const ensureCreditCardAssignable = async (userId, creditCardId) => {
  if (!creditCardId) {
    return;
  }

  const card = await creditCardsRepository.findById(creditCardId, {
    includeInactive: true,
  });

  if (!card || card.user_id !== userId) {
    throw createError(400, 'Credit card does not exist for the selected user');
  }
};

const ensureIncomeStreamAssignable = async (userId, incomeStreamId) => {
  if (!incomeStreamId) {
    return;
  }

  const stream = await incomeStreamsRepository.findById(incomeStreamId, {
    includeInactive: true,
  });

  if (!stream || stream.user_id !== userId) {
    throw createError(
      400,
      'Income stream does not exist for the selected user'
    );
  }
};

const toDatabaseTransaction = ({
  id,
  userId,
  creditCardId,
  incomeStreamId,
  cardCycleId,
  type,
  amountCents,
  currency,
  category,
  transactionDate,
  isPending,
  merchant,
  memo,
  occurredAt,
}) =>
  Object.fromEntries(
    Object.entries({
      id,
      user_id: userId,
      credit_card_id: creditCardId,
      income_stream_id: incomeStreamId,
      card_cycle_id: cardCycleId,
      type,
      amount_cents: amountCents,
      currency,
      category,
      transaction_date: transactionDate,
      is_pending: isPending,
      merchant,
      memo,
      occurred_at: occurredAt,
    }).filter(([, value]) => value !== undefined)
  );

const listTransactions = async (
  currentUser,
  { type, userId, startDate, endDate, category, creditCardId } = {}
) => {
  const targetUserId = await resolveTargetUserId(currentUser, userId);

  if (startDate && endDate && startDate > endDate) {
    throw createError(400, 'Start date cannot be after end date');
  }

  if (creditCardId) {
    await ensureCreditCardAssignable(targetUserId, creditCardId);
  }

  const normalizedCategory = category ? category.trim() : undefined;

  const transactions = await transactionsRepository.findByUserId({
    userId: targetUserId,
    type,
    startDate,
    endDate,
    category: normalizedCategory,
    creditCardId,
  });

  return transactions.map(serializeTransaction);
};

const getTransaction = async (currentUser, id) => {
  const transaction = await transactionsRepository.findById(id);

  ensureTransactionAccessible(currentUser, transaction);

  return serializeTransaction(transaction);
};

const createTransaction = async (currentUser, payload) => {
  const targetUserId = await resolveTargetUserId(currentUser, payload.userId);

  await ensureCreditCardAssignable(targetUserId, payload.creditCardId);
  await ensureIncomeStreamAssignable(targetUserId, payload.incomeStreamId);

  const id = randomUUID();

  const created = await transactionsRepository.create(
    toDatabaseTransaction({
      ...payload,
      id,
      userId: targetUserId,
      currency: payload.currency ?? 'CAD',
    })
  );

  return serializeTransaction(created);
};

const updateTransaction = async (currentUser, id, payload) => {
  const existing = await transactionsRepository.findById(id);

  ensureTransactionAccessible(currentUser, existing);

  const targetUserId = existing.user_id;

  if (
    payload.creditCardId &&
    payload.creditCardId !== existing.credit_card_id
  ) {
    await ensureCreditCardAssignable(targetUserId, payload.creditCardId);
  }

  if (
    payload.incomeStreamId &&
    payload.incomeStreamId !== existing.income_stream_id
  ) {
    await ensureIncomeStreamAssignable(targetUserId, payload.incomeStreamId);
  }

  const updates = toDatabaseTransaction(payload);

  if (Object.keys(updates).length === 0) {
    return serializeTransaction(existing);
  }

  const updated = await transactionsRepository.updateById(id, updates);

  return serializeTransaction(updated);
};

const deleteTransaction = async (currentUser, id) => {
  const existing = await transactionsRepository.findById(id);

  ensureTransactionAccessible(currentUser, existing);

  await transactionsRepository.deleteById(id);
};

module.exports = {
  listTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
