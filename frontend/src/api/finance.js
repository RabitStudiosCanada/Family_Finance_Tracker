import { apiFetch } from './client';

export const fetchCreditCards = (token) =>
  apiFetch('/credit-cards', {
    method: 'GET',
    token,
  });

export const fetchIncomeStreams = (token) =>
  apiFetch('/income-streams', {
    method: 'GET',
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
