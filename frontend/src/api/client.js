const DEFAULT_BASE_URL = 'http://localhost:3001/api';

export class ApiError extends Error {
  constructor(message, { status, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const resolveBaseUrl = () =>
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || DEFAULT_BASE_URL;

export const apiFetch = async (
  path,
  { method = 'GET', token, body, headers } = {}
) => {
  const baseUrl = resolveBaseUrl();
  const requestInit = {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (token) {
    requestInit.headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    requestInit.body = JSON.stringify(body);
  }

  const response = await fetch(`${baseUrl}${path}`, requestInit);

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      payload?.message || `Request failed with status ${response.status}`;

    throw new ApiError(message, {
      status: response.status,
      details: payload?.details,
    });
  }

  return payload?.data ?? payload ?? null;
};
