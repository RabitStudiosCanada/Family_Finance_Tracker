const createError = require('http-errors');
const { randomUUID } = require('node:crypto');

const categoryBudgetsRepository = require('../repositories/categoryBudgetsRepository');
const usersRepository = require('../repositories/usersRepository');
const transactionsRepository = require('../repositories/transactionsRepository');
const {
  serializeCategoryBudget,
  serializeCategoryBudgetSummary,
} = require('../utils/serializers');

const DEFAULT_WARNING_THRESHOLD = 0.85;

const formatDate = (date) => date.toISOString().slice(0, 10);

const parseDate = (value) => {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day));
};

const startOfMonth = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

const endOfMonth = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));

const resolvePeriodBounds = (budget, referenceDate) => {
  const reference = parseDate(referenceDate) || new Date();
  const explicitStart = parseDate(budget.period_start_date);
  const explicitEnd = parseDate(budget.period_end_date);

  if (explicitStart && explicitEnd) {
    return {
      startDate: formatDate(explicitStart),
      endDate: formatDate(explicitEnd),
    };
  }

  if (budget.period === 'monthly') {
    const start = explicitStart || startOfMonth(reference);
    const end = explicitEnd || endOfMonth(reference);

    return {
      startDate: formatDate(start),
      endDate: formatDate(end),
    };
  }

  if (explicitStart || explicitEnd) {
    return {
      startDate: explicitStart ? formatDate(explicitStart) : undefined,
      endDate: explicitEnd ? formatDate(explicitEnd) : undefined,
    };
  }

  const start = startOfMonth(reference);
  const end = endOfMonth(reference);

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
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

const listCategoryBudgetSummaries = async (
  currentUser,
  { userId, includeInactive = false, referenceDate } = {}
) => {
  const targetUserId = await resolveTargetUserId(currentUser, userId);
  const budgets = await categoryBudgetsRepository.findByUserId({
    userId: targetUserId,
    includeInactive,
  });

  const summaries = await Promise.all(
    budgets.map(async (budget) => {
      const { startDate, endDate } = resolvePeriodBounds(budget, referenceDate);

      const spentAmountCents =
        await transactionsRepository.calculateCategorySpend({
          userId: targetUserId,
          category: budget.category,
          startDate,
          endDate,
        });

      const limitAmountCents = Number(budget.limit_amount_cents ?? 0);
      const warningThreshold =
        budget.warning_threshold !== undefined &&
        budget.warning_threshold !== null
          ? Number(budget.warning_threshold)
          : DEFAULT_WARNING_THRESHOLD;

      const utilisation = limitAmountCents
        ? spentAmountCents / limitAmountCents
        : 0;

      const status =
        limitAmountCents && spentAmountCents > limitAmountCents
          ? 'over'
          : utilisation >= warningThreshold
            ? 'warning'
            : 'ok';

      return serializeCategoryBudgetSummary({
        ...budget,
        warning_threshold: warningThreshold,
        period_start_date: startDate,
        period_end_date: endDate,
        spent_amount_cents: spentAmountCents,
        remaining_amount_cents: Math.max(
          limitAmountCents - spentAmountCents,
          0
        ),
        utilisation,
        status,
      });
    })
  );

  return summaries;
};

module.exports = {
  listCategoryBudgets,
  createCategoryBudget,
  updateCategoryBudget,
  deleteCategoryBudget,
  listCategoryBudgetSummaries,
};
