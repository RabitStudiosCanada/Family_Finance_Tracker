import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';

import { createTransaction } from '../api/finance';
import { ApiError } from '../api/client';
import { useAuth } from '../providers/AuthProvider.jsx';

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

const positiveNumberOrNull = (value) => {
  const parsed = Number.parseFloat(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const centsFromAmount = (amount) => Math.round(Math.abs(amount) * 100);

const initialFormState = (creditCardId) => ({
  amount: '',
  category: '',
  creditCardId: creditCardId ?? '',
  transactionDate: todayIsoDate(),
  merchant: '',
});

export default function QuickAddTransaction({ creditCards, onSuccess }) {
  const { accessToken } = useAuth();
  const defaultCardId = useMemo(() => creditCards[0]?.id ?? '', [creditCards]);
  const [form, setForm] = useState(() => initialFormState(defaultCardId));
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    setForm((previous) => {
      if (!previous.creditCardId) {
        return { ...previous, creditCardId: defaultCardId };
      }

      const stillExists = creditCards.some(
        (card) => card.id === previous.creditCardId
      );

      if (stillExists) {
        return previous;
      }

      return { ...previous, creditCardId: defaultCardId };
    });
  }, [creditCards, defaultCardId]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!accessToken) {
      return;
    }

    setStatus('submitting');
    setError(null);
    setSuccessMessage(null);

    const amountValue = positiveNumberOrNull(form.amount);

    if (amountValue === null) {
      setStatus('error');
      setError('Enter a positive amount to record an expense.');
      return;
    }

    if (!form.category.trim()) {
      setStatus('error');
      setError('Category is required.');
      return;
    }

    if (!form.creditCardId) {
      setStatus('error');
      setError('Select a credit card to attribute the purchase.');
      return;
    }

    try {
      const payload = {
        creditCardId: form.creditCardId,
        type: 'expense',
        amountCents: -centsFromAmount(amountValue),
        category: form.category.trim(),
        transactionDate: form.transactionDate,
        merchant: form.merchant.trim() || undefined,
      };

      const response = await createTransaction(accessToken, payload);

      setStatus('success');
      setSuccessMessage('Expense saved to your ledger.');
      setForm(initialFormState(defaultCardId));

      if (onSuccess) {
        onSuccess(response.transaction);
      }
    } catch (submissionError) {
      const message =
        submissionError instanceof ApiError
          ? submissionError.message
          : 'Unable to save this transaction right now.';
      setStatus('error');
      setError(message);
    }
  };

  const isSubmitting = status === 'submitting';
  const hasCards = creditCards.length > 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Quick add expense
        </h2>
        <p className="text-sm text-slate-600">
          Log a purchase against any tracked card without leaving the overview.
        </p>
      </header>

      {hasCards ? (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Amount
              </span>
              <input
                type="number"
                name="amount"
                min="0"
                step="0.01"
                required
                value={form.amount}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Category
              </span>
              <input
                type="text"
                name="category"
                maxLength={120}
                required
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Credit card
              </span>
              <select
                name="creditCardId"
                value={form.creditCardId}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {creditCards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.nickname} •••• {card.lastFour || '0000'}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Purchase date
              </span>
              <input
                type="date"
                name="transactionDate"
                value={form.transactionDate}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Merchant (optional)
            </span>
            <input
              type="text"
              name="merchant"
              maxLength={120}
              value={form.merchant}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          {error ? (
            <p className="text-sm text-rose-600" role="alert">
              {error}
            </p>
          ) : null}
          {successMessage ? (
            <p className="text-sm text-emerald-600">{successMessage}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Saving…' : 'Add expense'}
          </button>
        </form>
      ) : (
        <p className="text-sm text-slate-600">
          Add a credit card to enable quick expense entry from this dashboard.
        </p>
      )}
    </section>
  );
}

QuickAddTransaction.propTypes = {
  creditCards: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      nickname: PropTypes.string.isRequired,
      lastFour: PropTypes.string,
    })
  ),
  onSuccess: PropTypes.func,
};

QuickAddTransaction.defaultProps = {
  creditCards: [],
  onSuccess: undefined,
};
