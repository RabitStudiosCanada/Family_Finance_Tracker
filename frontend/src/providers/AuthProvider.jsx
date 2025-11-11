import PropTypes from 'prop-types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import * as authApi from '../api/auth';
import { ApiError } from '../api/client';

const AuthContext = createContext(undefined);

const ACCESS_TOKEN_STORAGE_KEY = 'fft.accessToken';
const REFRESH_TOKEN_STORAGE_KEY = 'fft.refreshToken';

const isStorageAvailable = () =>
  typeof window !== 'undefined' && window.localStorage;

const loadStoredTokens = () => {
  if (!isStorageAvailable()) {
    return { accessToken: null, refreshToken: null };
  }

  return {
    accessToken: window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY),
    refreshToken: window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY),
  };
};

export const AuthProvider = ({ children }) => {
  const [{ accessToken: storedAccessToken, refreshToken: storedRefreshToken }] =
    useState(() => loadStoredTokens());
  const [accessToken, setAccessToken] = useState(storedAccessToken);
  const [refreshToken, setRefreshToken] = useState(storedRefreshToken);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(
    storedAccessToken ? 'loading' : 'unauthenticated'
  );
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!accessToken) {
      setUser(null);
      setStatus('unauthenticated');
      return;
    }

    let isMounted = true;

    const hydrateSession = async () => {
      try {
        setStatus('loading');
        const response = await authApi.fetchCurrentUser(accessToken);

        if (!isMounted) {
          return;
        }

        setUser(response.user);
        setStatus('authenticated');
        setError(null);
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }

        if (
          fetchError instanceof ApiError &&
          fetchError.status === 401 &&
          refreshToken
        ) {
          try {
            const refreshed = await authApi.refresh({ refreshToken });
            setAccessToken(refreshed.tokens.accessToken);
            if (isStorageAvailable()) {
              window.localStorage.setItem(
                ACCESS_TOKEN_STORAGE_KEY,
                refreshed.tokens.accessToken
              );
            }
            setRefreshToken(refreshed.tokens.refreshToken);
            if (isStorageAvailable()) {
              window.localStorage.setItem(
                REFRESH_TOKEN_STORAGE_KEY,
                refreshed.tokens.refreshToken
              );
            }
            setUser(refreshed.user);
            setStatus('authenticated');
            setError(null);
            return;
          } catch (refreshError) {
            console.warn('Failed to refresh session', refreshError); // eslint-disable-line no-console
          }
        }

        setAccessToken(null);
        setRefreshToken(null);
        if (isStorageAvailable()) {
          window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
          window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
        }
        setUser(null);
        setStatus('unauthenticated');
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Unable to authenticate'
        );
      }
    };

    hydrateSession();

    return () => {
      isMounted = false;
    };
  }, [accessToken, refreshToken]);

  const login = useCallback(async ({ email, password }) => {
    setError(null);
    setStatus('loading');

    try {
      const result = await authApi.login({ email, password });
      setAccessToken(result.tokens.accessToken);
      setRefreshToken(result.tokens.refreshToken);
      setUser(result.user);
      setStatus('authenticated');
      if (isStorageAvailable()) {
        window.localStorage.setItem(
          ACCESS_TOKEN_STORAGE_KEY,
          result.tokens.accessToken
        );
        window.localStorage.setItem(
          REFRESH_TOKEN_STORAGE_KEY,
          result.tokens.refreshToken
        );
      }
      return result.user;
    } catch (loginError) {
      const message =
        loginError instanceof Error ? loginError.message : 'Unable to sign in';
      setError(message);
      setStatus('unauthenticated');
      throw loginError;
    }
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setStatus('unauthenticated');
    setError(null);
    if (isStorageAvailable()) {
      window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
      window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    }
  }, []);

  const value = useMemo(
    () => ({
      accessToken,
      refreshToken,
      user,
      status,
      error,
      isAuthenticated: status === 'authenticated',
      login,
      logout,
    }),
    [accessToken, refreshToken, user, status, error, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
