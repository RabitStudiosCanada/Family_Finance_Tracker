import { apiFetch } from './client';

export const fetchCreditCards = (token) =>
  apiFetch('/credit-cards', {
    method: 'GET',
    token,
  });

export const createCreditCard = (token, payload) =>
  apiFetch('/credit-cards', {
    method: 'POST',
    token,
    body: payload,
  });

export const updateCreditCard = (token, cardId, payload) =>
  apiFetch(`/credit-cards/${cardId}`, {
    method: 'PATCH',
    token,
    body: payload,
  });

export const archiveCreditCard = (token, cardId) =>
  apiFetch(`/credit-cards/${cardId}/archive`, {
    method: 'PATCH',
    token,
  });

export const fetchIncomeStreams = (token) =>
  apiFetch('/income-streams', {
    method: 'GET',
    token,
  });

export const createIncomeStream = (token, payload) =>
  apiFetch('/income-streams', {
    method: 'POST',
    token,
    body: payload,
  });

export const updateIncomeStream = (token, streamId, payload) =>
  apiFetch(`/income-streams/${streamId}`, {
    method: 'PATCH',
    token,
    body: payload,
  });

export const archiveIncomeStream = (token, streamId) =>
  apiFetch(`/income-streams/${streamId}/archive`, {
    method: 'PATCH',
    token,
  });

export const fetchTransactions = (token, params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null
    )
  ).toString();
  const suffix = query ? `?${query}` : '';

  return apiFetch(`/transactions${suffix}`, {
    method: 'GET',
    token,
  });
};

export const createTransaction = (token, payload) =>
  apiFetch('/transactions', {
    method: 'POST',
    token,
    body: payload,
  });

export const fetchAgencySnapshots = (token, params = {}) => {
  const query = new URLSearchParams(params).toString();
  const suffix = query ? `?${query}` : '';

  return apiFetch(`/agency${suffix}`, {
    method: 'GET',
    token,
  });
};

export const recalculateAgencySnapshot = (token, payload) =>
  apiFetch('/agency/recalculate', {
    method: 'POST',
    token,
    body: payload,
  });

export const fetchPaymentCycles = (token, params = {}) => {
  const query = new URLSearchParams(params).toString();
  const suffix = query ? `?${query}` : '';

  return apiFetch(`/payment-cycles${suffix}`, {
    method: 'GET',
    token,
  });
};

export const recordPaymentCycle = (token, cycleId, payload = {}) =>
  apiFetch(`/payment-cycles/${cycleId}/record-payment`, {
    method: 'POST',
    token,
    body: payload,
  });

const appendStatuses = (searchParams, statuses) => {
  if (!statuses?.length) {
    return;
  }

  statuses.forEach((status) => {
    searchParams.append('statuses', status);
  });
};

export const fetchProjectedExpenses = (token, params = {}) => {
  const searchParams = new URLSearchParams();

  if (params.userId) {
    searchParams.set('userId', params.userId);
  }

  if (params.status) {
    searchParams.set('status', params.status);
  }

  appendStatuses(searchParams, params.statuses);

  const query = searchParams.toString();
  const suffix = query ? `?${query}` : '';

  return apiFetch(`/projected-expenses${suffix}`, {
    method: 'GET',
    token,
  });
};

export const createProjectedExpense = (token, payload) =>
  apiFetch('/projected-expenses', {
    method: 'POST',
    token,
    body: payload,
  });

export const updateProjectedExpense = (token, expenseId, payload) =>
  apiFetch(`/projected-expenses/${expenseId}`, {
    method: 'PATCH',
    token,
    body: payload,
  });

export const commitProjectedExpense = (token, expenseId) =>
  apiFetch(`/projected-expenses/${expenseId}/commit`, {
    method: 'POST',
    token,
  });

export const markProjectedExpensePaid = (token, expenseId, payload = {}) =>
  apiFetch(`/projected-expenses/${expenseId}/mark-paid`, {
    method: 'POST',
    token,
    body: payload,
  });

export const cancelProjectedExpense = (token, expenseId, payload = {}) =>
  apiFetch(`/projected-expenses/${expenseId}/cancel`, {
    method: 'POST',
    token,
    body: payload,
  });

export const deleteProjectedExpense = (token, expenseId) =>
  apiFetch(`/projected-expenses/${expenseId}`, {
    method: 'DELETE',
    token,
  });

export const fetchSavingsGoals = (token, params = {}) => {
  const searchParams = new URLSearchParams();

  if (params.userId) {
    searchParams.set('userId', params.userId);
  }

  if (params.status) {
    searchParams.set('status', params.status);
  }

  appendStatuses(searchParams, params.statuses);

  const query = searchParams.toString();
  const suffix = query ? `?${query}` : '';

  return apiFetch(`/savings-goals${suffix}`, {
    method: 'GET',
    token,
  });
};

export const fetchSavingsGoal = (token, goalId) =>
  apiFetch(`/savings-goals/${goalId}`, {
    method: 'GET',
    token,
  });

export const createSavingsGoal = (token, payload) =>
  apiFetch('/savings-goals', {
    method: 'POST',
    token,
    body: payload,
  });

export const updateSavingsGoal = (token, goalId, payload) =>
  apiFetch(`/savings-goals/${goalId}`, {
    method: 'PATCH',
    token,
    body: payload,
  });

export const completeSavingsGoal = (token, goalId) =>
  apiFetch(`/savings-goals/${goalId}/complete`, {
    method: 'POST',
    token,
  });

export const abandonSavingsGoal = (token, goalId, payload = {}) =>
  apiFetch(`/savings-goals/${goalId}/abandon`, {
    method: 'POST',
    token,
    body: payload,
  });

export const addSavingsGoalContribution = (token, goalId, payload) =>
  apiFetch(`/savings-goals/${goalId}/contributions`, {
    method: 'POST',
    token,
    body: payload,
  });

export const deleteSavingsGoalContribution = (token, goalId, contributionId) =>
  apiFetch(`/savings-goals/${goalId}/contributions/${contributionId}`, {
    method: 'DELETE',
    token,
  });

export const fetchSavingsGoalContributions = (token, goalId) =>
  apiFetch(`/savings-goals/${goalId}/contributions`, {
    method: 'GET',
    token,
  });
