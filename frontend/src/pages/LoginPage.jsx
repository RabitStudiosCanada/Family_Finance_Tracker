import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import FullScreenLoader from '../components/FullScreenLoader.jsx';
import { useAuth } from '../providers/AuthProvider.jsx';

export default function LoginPage({ onAuthenticated }) {
  const { login, status, error, isAuthenticated } = useAuth();
  const [formState, setFormState] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      onAuthenticated();
    }
  }, [isAuthenticated, onAuthenticated]);

  if (status === 'loading') {
    return <FullScreenLoader message="Checking your session…" />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError(null);
    setSubmitting(true);

    try {
      await login(formState);
      onAuthenticated();
    } catch (submitError) {
      setFormError(
        submitError instanceof Error ? submitError.message : 'Unable to sign in'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Family Finance Tracker
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-600">
            Use your adult or admin account to access the finance workspace.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="block text-sm font-medium text-slate-700">
            Email address
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formState.email}
              onChange={handleChange}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formState.password}
              onChange={handleChange}
            />
          </label>
          {(formError || error) && (
            <p className="text-sm font-medium text-rose-600">
              {formError || error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-slate-500">
          Admin accounts can manage multiple adults. Adults only see their own
          data.
        </p>
      </div>
    </div>
  );
}

LoginPage.propTypes = {
  onAuthenticated: PropTypes.func,
};

LoginPage.defaultProps = {
  onAuthenticated: () => {},
};
