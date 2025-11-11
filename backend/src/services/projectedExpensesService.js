const createError = require('http-errors');
const { randomUUID } = require('node:crypto');

const projectedExpensesRepository = require('../repositories/projectedExpensesRepository');
const usersRepository = require('../repositories/usersRepository');
const { serializeProjectedExpense } = require('../utils/serializers');

const ALLOWED_TRANSITIONS = {
  planned: ['committed', 'cancelled'],
  committed: ['paid', 'cancelled'],
  paid: [],
  cancelled: [],
};

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

const ensureExpenseAccessible = (currentUser, expense) => {
  if (!expense) {
    throw createError(404, 'Projected expense not found');
  }

  if (currentUser.role !== 'admin' && expense.user_id !== currentUser.id) {
    throw createError(404, 'Projected expense not found');
  }
};

const toDatabaseExpense = ({
  id,
  userId,
  creditCardId,
  transactionId,
  amountCents,
  category,
  expectedDate,
  status,
  notes,
  committedAt,
  paidAt,
  cancelledAt,
  cancelledReason,
}) =>
  Object.fromEntries(
    Object.entries({
      id,
      user_id: userId,
      credit_card_id: creditCardId,
      transaction_id: transactionId,
      amount_cents: amountCents,
      category,
      expected_date: expectedDate,
      status,
      notes,
      committed_at: committedAt,
      paid_at: paidAt,
      cancelled_at: cancelledAt,
      cancelled_reason: cancelledReason,
    }).filter(([, value]) => value !== undefined)
  );

const listProjectedExpenses = async (
  currentUser,
  { userId, statuses, status } = {}
) => {
  const targetUserId = await resolveTargetUserId(currentUser, userId);
  const rawStatuses = statuses ?? status;
  const normalizedStatuses = Array.isArray(rawStatuses)
    ? rawStatuses
    : rawStatuses
      ? [rawStatuses]
      : undefined;

  const expenses = await projectedExpensesRepository.findByUserId({
    userId: targetUserId,
    statuses: normalizedStatuses,
  });

  return expenses.map(serializeProjectedExpense);
};

const getProjectedExpense = async (currentUser, id) => {
  const expense = await projectedExpensesRepository.findById(id);

  ensureExpenseAccessible(currentUser, expense);

  return serializeProjectedExpense(expense);
};

const createProjectedExpense = async (currentUser, payload) => {
  const targetUserId = await resolveTargetUserId(currentUser, payload.userId);
  const id = randomUUID();

  const created = await projectedExpensesRepository.create(
    toDatabaseExpense({
      ...payload,
      id,
      userId: targetUserId,
      status: 'planned',
    })
  );

  return serializeProjectedExpense(created);
};

const updateProjectedExpense = async (currentUser, id, payload) => {
  const existing = await projectedExpensesRepository.findById(id);

  ensureExpenseAccessible(currentUser, existing);

  if (['paid', 'cancelled'].includes(existing.status)) {
    throw createError(409, 'Completed projected expenses cannot be updated');
  }

  const updates = toDatabaseExpense(payload);

  if (Object.keys(updates).length === 0) {
    return serializeProjectedExpense(existing);
  }

  const updated = await projectedExpensesRepository.updateById(id, updates);

  return serializeProjectedExpense(updated);
};

const transitionExpense = async (expense, nextStatus) => {
  const allowedStatuses = ALLOWED_TRANSITIONS[expense.status] || [];

  if (!allowedStatuses.includes(nextStatus)) {
    throw createError(409, 'Invalid projected expense transition');
  }
};

const commitProjectedExpense = async (currentUser, id) => {
  const existing = await projectedExpensesRepository.findById(id);

  ensureExpenseAccessible(currentUser, existing);
  await transitionExpense(existing, 'committed');

  const committed = await projectedExpensesRepository.updateById(id, {
    status: 'committed',
    committed_at: new Date().toISOString(),
  });

  return serializeProjectedExpense(committed);
};

const markProjectedExpensePaid = async (currentUser, id, payload = {}) => {
  const existing = await projectedExpensesRepository.findById(id);

  ensureExpenseAccessible(currentUser, existing);
  await transitionExpense(existing, 'paid');

  const updated = await projectedExpensesRepository.updateById(id, {
    status: 'paid',
    paid_at: new Date().toISOString(),
    transaction_id: payload.transactionId ?? null,
  });

  return serializeProjectedExpense(updated);
};

const cancelProjectedExpense = async (currentUser, id, payload = {}) => {
  const existing = await projectedExpensesRepository.findById(id);

  ensureExpenseAccessible(currentUser, existing);
  await transitionExpense(existing, 'cancelled');

  const updated = await projectedExpensesRepository.updateById(id, {
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
    cancelled_reason: payload.reason ?? null,
  });

  return serializeProjectedExpense(updated);
};

const deleteProjectedExpense = async (currentUser, id) => {
  const existing = await projectedExpensesRepository.findById(id);

  ensureExpenseAccessible(currentUser, existing);

  if (existing.status !== 'planned') {
    throw createError(409, 'Only planned projected expenses can be deleted');
  }

  await projectedExpensesRepository.deleteById(id);
};

module.exports = {
  listProjectedExpenses,
  getProjectedExpense,
  createProjectedExpense,
  updateProjectedExpense,
  commitProjectedExpense,
  markProjectedExpensePaid,
  cancelProjectedExpense,
  deleteProjectedExpense,
};
