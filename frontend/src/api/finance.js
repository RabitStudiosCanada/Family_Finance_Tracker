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
