const createError = require('http-errors');
const { randomUUID } = require('node:crypto');

const savingsGoalsRepository = require('../repositories/savingsGoalsRepository');
const savingsContributionsRepository = require('../repositories/savingsContributionsRepository');
const usersRepository = require('../repositories/usersRepository');
const {
  serializeSavingsGoal,
  serializeSavingsContribution,
} = require('../utils/serializers');

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

const ensureGoalAccessible = (currentUser, goal) => {
  if (!goal) {
    throw createError(404, 'Savings goal not found');
  }

  if (currentUser.role !== 'admin' && goal.owner_user_id !== currentUser.id) {
    throw createError(404, 'Savings goal not found');
  }
};

const toDatabaseGoal = ({
  id,
  ownerUserId,
  name,
  targetAmountCents,
  startDate,
  targetDate,
  status,
  category,
  notes,
  completedAt,
  abandonedAt,
  abandonedReason,
}) =>
  Object.fromEntries(
    Object.entries({
      id,
      owner_user_id: ownerUserId,
      name,
      target_amount_cents: targetAmountCents,
      start_date: startDate,
      target_date: targetDate,
      status,
      category,
      notes,
      completed_at: completedAt,
      abandoned_at: abandonedAt,
      abandoned_reason: abandonedReason,
    }).filter(([, value]) => value !== undefined)
  );

const toDatabaseContribution = ({
  id,
  goalId,
  userId,
  amountCents,
  source,
  contributionDate,
  notes,
}) =>
  Object.fromEntries(
    Object.entries({
      id,
      goal_id: goalId,
      user_id: userId,
      amount_cents: amountCents,
      source,
      contribution_date: contributionDate,
      notes,
    }).filter(([, value]) => value !== undefined)
  );

const listSavingsGoals = async (
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

  const goals = await savingsGoalsRepository.findByOwnerId({
    ownerUserId: targetUserId,
    statuses: normalizedStatuses,
  });

  return goals.map(serializeSavingsGoal);
};

const getSavingsGoal = async (currentUser, id) => {
  const goal = await savingsGoalsRepository.findById(id);

  ensureGoalAccessible(currentUser, goal);

  return serializeSavingsGoal(goal);
};

const createSavingsGoal = async (currentUser, payload) => {
  const ownerUserId = await resolveTargetUserId(
    currentUser,
    payload.ownerUserId
  );
  const id = randomUUID();

  const created = await savingsGoalsRepository.create(
    toDatabaseGoal({
      ...payload,
      id,
      ownerUserId,
      status: 'active',
    })
  );

  return serializeSavingsGoal(created);
};

const updateSavingsGoal = async (currentUser, id, payload) => {
  const existing = await savingsGoalsRepository.findById(id);

  ensureGoalAccessible(currentUser, existing);

  if (existing.status !== 'active') {
    throw createError(409, 'Only active savings goals can be updated');
  }

  const updates = toDatabaseGoal(payload);

  if (Object.keys(updates).length === 0) {
    return serializeSavingsGoal(existing);
  }

  const updated = await savingsGoalsRepository.updateById(id, updates);

  return serializeSavingsGoal(updated);
};

const completeSavingsGoal = async (currentUser, id) => {
  const existing = await savingsGoalsRepository.findById(id);

  ensureGoalAccessible(currentUser, existing);

  if (existing.status !== 'active') {
    throw createError(409, 'Only active savings goals can be completed');
  }

  const updated = await savingsGoalsRepository.updateById(id, {
    status: 'completed',
    completed_at: new Date().toISOString(),
  });

  return serializeSavingsGoal(updated);
};

const abandonSavingsGoal = async (currentUser, id, payload = {}) => {
  const existing = await savingsGoalsRepository.findById(id);

  ensureGoalAccessible(currentUser, existing);

  if (existing.status !== 'active') {
    throw createError(409, 'Only active savings goals can be abandoned');
  }

  const updated = await savingsGoalsRepository.updateById(id, {
    status: 'abandoned',
    abandoned_at: new Date().toISOString(),
    abandoned_reason: payload.reason ?? null,
  });

  return serializeSavingsGoal(updated);
};

const addContribution = async (currentUser, goalId, payload) => {
  const goal = await savingsGoalsRepository.findById(goalId);

  ensureGoalAccessible(currentUser, goal);

  if (goal.status !== 'active') {
    throw createError(
      409,
      'Only active savings goals can receive contributions'
    );
  }

  const id = randomUUID();

  const created = await savingsContributionsRepository.create(
    toDatabaseContribution({
      ...payload,
      id,
      goalId,
      userId:
        currentUser.role === 'admin'
          ? (payload.userId ?? currentUser.id)
          : currentUser.id,
    })
  );

  const refreshedGoal = await savingsGoalsRepository.findById(goalId);

  return {
    goal: serializeSavingsGoal(refreshedGoal),
    contribution: serializeSavingsContribution(created),
  };
};

const deleteContribution = async (currentUser, goalId, contributionId) => {
  const goal = await savingsGoalsRepository.findById(goalId);

  ensureGoalAccessible(currentUser, goal);

  const contribution =
    await savingsContributionsRepository.findById(contributionId);

  if (!contribution || contribution.goal_id !== goalId) {
    throw createError(404, 'Savings contribution not found');
  }

  await savingsContributionsRepository.deleteById(contributionId);

  const refreshedGoal = await savingsGoalsRepository.findById(goalId);

  return serializeSavingsGoal(refreshedGoal);
};

const listContributions = async (currentUser, goalId) => {
  const goal = await savingsGoalsRepository.findById(goalId);

  ensureGoalAccessible(currentUser, goal);

  const contributions =
    await savingsContributionsRepository.findByGoalId(goalId);

  return contributions.map(serializeSavingsContribution);
};

module.exports = {
  listSavingsGoals,
  getSavingsGoal,
  createSavingsGoal,
  updateSavingsGoal,
  completeSavingsGoal,
  abandonSavingsGoal,
  addContribution,
  deleteContribution,
  listContributions,
};
