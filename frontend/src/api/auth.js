import { apiFetch } from './client';

export const login = ({ email, password }) =>
  apiFetch('/auth/login', {
    method: 'POST',
    body: { email, password },
  });

export const refresh = ({ refreshToken }) =>
  apiFetch('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
  });

export const fetchCurrentUser = (token) =>
  apiFetch('/auth/me', {
    method: 'GET',
    token,
  });
