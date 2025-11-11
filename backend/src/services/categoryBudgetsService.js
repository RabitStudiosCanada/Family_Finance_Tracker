const createError = require('http-errors');
const { randomUUID } = require('node:crypto');

const categoryBudgetsRepository = require('../repositories/categoryBudgetsRepository');
const usersRepository = require('../repositories/usersRepository');
const { serializeCategoryBudget } = require('../utils/serializers');

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

const ensureBudgetAccessible = (currentUser, budget) => {
  if (!budget) {
    throw createError(404, 'Category budget not found');
  }

  if (currentUser.role !== 'admin' && budget.user_id !== currentUser.id) {
    throw createError(404, 'Category budget not found');
  }
};

const toDatabaseBudget = ({
  id,
  userId,
  category,
  period,
  limitAmountCents,
  warningThreshold,
  periodStartDate,
  periodEndDate,
  isActive,
}) =>
  Object.fromEntries(
    Object.entries({
      id,
      user_id: userId,
      category,
      period,
      limit_amount_cents: limitAmountCents,
      warning_threshold: warningThreshold,
      period_start_date: periodStartDate,
      period_end_date: periodEndDate,
      is_active: isActive,
    }).filter(([, value]) => value !== undefined)
  );

const listCategoryBudgets = async (
  currentUser,
  { userId, includeInactive = false } = {}
) => {
  const targetUserId = await resolveTargetUserId(currentUser, userId);

  const budgets = await categoryBudgetsRepository.findByUserId({
    userId: targetUserId,
    includeInactive,
  });

  return budgets.map(serializeCategoryBudget);
};

const createCategoryBudget = async (currentUser, payload) => {
  const userId = await resolveTargetUserId(currentUser, payload.userId);
  const id = randomUUID();

  const created = await categoryBudgetsRepository.create(
    toDatabaseBudget({
      ...payload,
      id,
      userId,
      isActive: payload.isActive ?? true,
    })
  );

  return serializeCategoryBudget(created);
};

const updateCategoryBudget = async (currentUser, id, payload) => {
  const existing = await categoryBudgetsRepository.findById(id);

  ensureBudgetAccessible(currentUser, existing);

  const updates = toDatabaseBudget(payload);

  if (Object.keys(updates).length === 0) {
    return serializeCategoryBudget(existing);
  }

  const updated = await categoryBudgetsRepository.updateById(id, updates);

  return serializeCategoryBudget(updated);
};

const deleteCategoryBudget = async (currentUser, id) => {
  const existing = await categoryBudgetsRepository.findById(id);

  ensureBudgetAccessible(currentUser, existing);

  await categoryBudgetsRepository.deleteById(id);
};

module.exports = {
  listCategoryBudgets,
  createCategoryBudget,
  updateCategoryBudget,
  deleteCategoryBudget,
};
